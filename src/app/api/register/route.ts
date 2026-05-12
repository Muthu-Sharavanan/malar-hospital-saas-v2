import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { patientSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validate Input
    const validation = patientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation Failed", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { name, phone, age, gender, address, doctorId, patientId, visitDate, visitTime, reason, abhaId, consentGranted } = validation.data;

    // Use a transaction to ensure either EVERYTHING succeeds or NOTHING is created
    const result = await prisma.$transaction(async (tx) => {
      let patient;
      let isNewPatient = false;

      if (patientId) {
        // Use the selected patient
        patient = await tx.patient.update({
          where: { id: patientId },
          data: { name, age, gender, address, phone, abhaId: abhaId || null, consentGranted: Boolean(consentGranted), consentDate: consentGranted ? new Date() : null }
        });
      } else {
        // 1. Check for Duplicate (Phone is the primary identifier for returning patients)
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        const existing = await tx.patient.findFirst({
          where: {
            phone: { 
              equals: trimmedPhone,
              not: "" 
            }
          }
        });

        if (existing) {
          // SILENT AUTO-LINK: If same phone exists, use it and update details
          patient = await tx.patient.update({
            where: { id: existing.id },
            data: { 
              name: trimmedName, 
              age: Number(age), 
              gender, 
              address, 
              abhaId: abhaId || null, 
              consentGranted: Boolean(consentGranted) 
            }
          });
        } else {
          isNewPatient = true;
          // Robust numeric UHID generation
          const allPatients = await tx.patient.findMany({
            select: { uhid: true }
          });
          
          let maxId = 10000;
          allPatients.forEach(p => {
            if (p.uhid && p.uhid.includes('-')) {
              const num = parseInt(p.uhid.split('-').pop() || "0");
              if (!isNaN(num) && num > maxId) maxId = num;
            }
          });
          
          let nextUhidNum = maxId + 1;
          let uhid = `MH-${nextUhidNum}`;
          
          // Safety check: Ensure the generated UHID isn't actually taken (rare race condition)
          let collision = await tx.patient.findUnique({ where: { uhid } });
          while (collision) {
            nextUhidNum++;
            uhid = `MH-${nextUhidNum}`;
            collision = await tx.patient.findUnique({ where: { uhid } });
          }
          
          patient = await tx.patient.create({
            data: { 
              uhid, 
              name: trimmedName, 
              age: Number(age), 
              gender, 
              phone: trimmedPhone, 
              address, 
              abhaId: abhaId || null, 
              consentGranted: Boolean(consentGranted), 
              consentDate: consentGranted ? new Date() : null 
            }
          });
        }
      }

      // 2. Prevent Double-Queueing for the same patient on the same day
      const visitDateObj = visitDate ? new Date(visitDate) : new Date();
      const tokenDateStart = new Date(visitDateObj);
      tokenDateStart.setHours(0, 0, 0, 0);
      const tokenDateEnd = new Date(visitDateObj);
      tokenDateEnd.setHours(23, 59, 59, 999);

      const activeVisit = await tx.visit.findFirst({
        where: {
          patientId: patient.id,
          visitDate: { gte: tokenDateStart, lte: tokenDateEnd },
          status: { not: 'COMPLETED' }
        }
      });

      if (activeVisit) {
        throw new Error(`Patient is already in the queue today with Token #${activeVisit.tokenNumber}.`);
      }

      const lastVisit = await tx.visit.findFirst({
        where: { visitDate: { gte: tokenDateStart, lte: tokenDateEnd } },
        orderBy: { tokenNumber: 'desc' }
      });

      const nextToken = lastVisit ? lastVisit.tokenNumber + 1 : 1;
      const selectedDoc = await tx.user.findUnique({ where: { id: doctorId } });
      const assignedDoctorName = selectedDoc?.name || 'Unknown';

      // 3. Create Visit
      const visit = await tx.visit.create({
        data: {
          patientId: patient.id,
          doctorId,
          assignedDoctorName,
          tokenNumber: nextToken,
          visitDate: visitDateObj,
          status: 'REGISTERED',
          chiefComplaints: reason || null
        },
        include: { patient: true, doctor: true }
      });

      // 4. Create Initial Bill
      await tx.bill.create({
        data: {
          visitId: visit.id,
          amount: 200,
          type: 'CONSULTATION',
          paymentStatus: 'UNPAID',
          finalAmount: 200
        }
      });

      return { visit, isNewPatient, uhid: patient.uhid };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const session = url.searchParams.get('session'); // morning | evening

    // Timezone-aware date window (IST is UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    const todayStart = new Date(istNow);
    todayStart.setUTCHours(0, 0, 0, 0);
    todayStart.setTime(todayStart.getTime() - istOffset); // Map back to UTC start
    
    const todayEnd = new Date(todayStart);
    todayEnd.setTime(todayEnd.getTime() + 24 * 60 * 60 * 1000 - 1);

    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        patient: true,
        doctor: true,
        bills: true
      },
      orderBy: {
        tokenNumber: 'asc'
      }
    });

    const enrichedVisits = visits.map(v => {
      const istDate = new Date(new Date(v.visitDate).getTime() + 5.5 * 60 * 60 * 1000);
      const hours = istDate.getUTCHours();
      const sessionLabel = hours < 12 ? 'morning' : 'evening';
      return { ...v, session: sessionLabel };
    });

    const filteredVisits = session 
      ? enrichedVisits.filter(v => v.session === session.toLowerCase())
      : enrichedVisits;

    return NextResponse.json({ success: true, visits: filteredVisits });
  } catch (error: any) {
    return handleApiError(error, 'GET register');
  }
}
