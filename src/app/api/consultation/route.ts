import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: Request) {
  try {
    const { visitId, status } = await req.json();
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: { status }
    });
    return NextResponse.json({ success: true, visit });
  } catch (error: any) {
    return handleApiError(error, 'PATCH consultation');
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate Input
    const validation = consultationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation Failed", details: validation.error.format() }, { status: 400 });
    }

    const { 
      visitId, chiefComplaints, history, examination, diagnosis, investigationAdvised, nextReview, isReview, drugs 
    } = validation.data;

    const visitSearch = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visitSearch) throw new Error("Visit not found");

    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear existing prescriptions if any (to support "Rewrite")
      await tx.prescription.deleteMany({ where: { visitId } });

      // 2. Add new prescriptions
      if (drugs && drugs.length > 0) {
        await tx.prescription.createMany({
          data: drugs.map((d: any) => ({
            visitId,
            drugName: d.name || d.drugName,
            dosage: d.dosage,
            duration: d.duration,
            instructions: d.instructions || ''
          }))
        });
      }

      // 3. Update visit findings
      const updatedVisit = await tx.visit.update({
        where: { id: visitId },
        data: {
          chiefComplaints,
          history,
          examination,
          diagnosis,
          investigationAdvised,
          nextReview,
          isReview: !!isReview,
          status: 'COMPLETED'
        }
      });

      return updatedVisit;
    });

    return NextResponse.json({ success: true, visit: result });
  } catch (error: any) {
    return handleApiError(error, 'POST consultation');
  }
}

export async function GET(req: Request) {
  try {
    const { cookies } = await import('next/headers');
    const sessionCookie = (await cookies()).get('session');

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const sessionName = (session.name || '').toLowerCase().trim().replace(/^(dr\.?\s*)+/, '');

    const url = new URL(req.url);
    const sessionType = url.searchParams.get('session'); // morning | evening

    // Timezone-aware date window (IST is UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    const todayStart = new Date(istNow);
    todayStart.setUTCHours(0, 0, 0, 0);
    todayStart.setTime(todayStart.getTime() - istOffset); // Map back to UTC start
    
    const todayEnd = new Date(todayStart);
    todayEnd.setTime(todayEnd.getTime() + 24 * 60 * 60 * 1000 - 1);

    const doctorsQueue = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: todayStart,
          lte: todayEnd
        },
        OR: [
          {
            assignedDoctorName: {
              contains: sessionName,
              mode: 'insensitive'
            }
          },
          {
            doctor: {
              name: {
                contains: sessionName,
                mode: 'insensitive'
              }
            }
          }
        ],
        status: { in: ['REGISTERED', 'VITALS_DONE', 'CONSULTING'] }
      },
      include: {
        patient: true,
        doctor: true,
        labOrders: true,
        prescriptions: true
      },
      orderBy: {
        tokenNumber: 'asc'
      }
    });

    // Fetch previous visit history for each patient to identify "Review" cases
    const enrichedQueue = await Promise.all(doctorsQueue.map(async (v) => {
      const istDate = new Date(new Date(v.visitDate).getTime() + 5.5 * 60 * 60 * 1000);
      const hours = istDate.getUTCHours();
      const sessionLabel = hours < 12 ? 'morning' : 'evening';

      // Find the most recent COMPLETED visit for this patient (excluding the current one)
      const lastVisit = await prisma.visit.findFirst({
        where: {
          patientId: v.patientId,
          status: 'COMPLETED',
          id: { not: v.id }
        },
        include: {
          prescriptions: true,
          labOrders: true,
          doctor: true
        },
        orderBy: { visitDate: 'desc' }
      });

      return { 
        ...v, 
        session: sessionLabel,
        isReview: v.isReview || !!lastVisit,
        lastVisitSummary: lastVisit
      };
    }));

    // Doctors should see the entire day's queue, ignoring session filters
    const filteredQueue = (session.role === 'DOCTOR' || !sessionType)
      ? enrichedQueue
      : enrichedQueue.filter(v => v.session === sessionType.toLowerCase());

    return NextResponse.json({ success: true, queue: filteredQueue });
  } catch (error: any) {
    return handleApiError(error, 'GET consultation');
  }
}
