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

    // 1. Check for EXACT duplicate (Name + Phone) if this is a manual entry (no patientId)
    if (!patientId && name && phone) {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();

      const existing = await prisma.patient.findFirst({
        where: {
          AND: [
            { name: { equals: trimmedName, mode: 'insensitive' } },
            { phone: { equals: trimmedPhone } },
            { name: { not: "" } },
            { phone: { not: "" } }
          ]
        }
      });
      if (existing) {
        return NextResponse.json({ 
          success: false, 
          error: "Patient already exists with this name and number", 
          uhid: existing.uhid || "MH-EXISTING",
          existingName: existing.name
        }, { status: 409 });
      }
    }

    let patient;
    let isNewPatient = false;

    if (patientId) {
      // Use the selected patient
      patient = await prisma.patient.update({
        where: { id: patientId },
        data: { name, age, gender, address, phone, abhaId: abhaId || null, consentGranted: Boolean(consentGranted), consentDate: consentGranted ? new Date() : null }
      });
    } else {
      isNewPatient = true;
      // More robust UHID generation: get the highest UHID and increment
      const lastPatient = await prisma.patient.findFirst({
        orderBy: { uhid: 'desc' }
      });
      
      let nextUhidNum = 10001;
      if (lastPatient && lastPatient.uhid.startsWith('MH-')) {
        const lastNum = parseInt(lastPatient.uhid.split('-')[1]);
        if (!isNaN(lastNum)) {
          nextUhidNum = lastNum + 1;
        }
      }
      
      const uhid = `MH-${nextUhidNum}`;
      patient = await prisma.patient.create({
        data: { uhid, name, age, gender, phone, address, abhaId: abhaId || null, consentGranted: Boolean(consentGranted), consentDate: consentGranted ? new Date() : null }
      });
    }

    // Calculate NEXT GLOBAL TOKEN for the specific visit date
    // Combine date + time as IST (UTC+5:30) so future appointment time is preserved
    let visitDateObj: Date;
    if (visitDate && visitTime) {
      visitDateObj = new Date(`${visitDate}T${visitTime}:00+05:30`);
    } else if (visitDate) {
      // No time provided — store as IST midnight
      visitDateObj = new Date(`${visitDate}T00:00:00+05:30`);
    } else {
      visitDateObj = new Date();
    }
    const tokenDateStart = new Date(visitDateObj);
    tokenDateStart.setHours(0, 0, 0, 0);
    const tokenDateEnd = new Date(visitDateObj);
    tokenDateEnd.setHours(23, 59, 59, 999);

    const lastVisit = await prisma.visit.findFirst({
      where: {
        visitDate: {
          gte: tokenDateStart,
          lte: tokenDateEnd
        }
      },
      orderBy: {
        tokenNumber: 'desc'
      }
    });

    const nextToken = lastVisit ? lastVisit.tokenNumber + 1 : 1;

    const selectedDoc = await prisma.user.findUnique({ where: { id: doctorId } });
    const assignedDoctorName = selectedDoc?.name || 'Unknown';

    // 2. Create Visit
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId,
        assignedDoctorName,
        tokenNumber: nextToken,
        visitDate: visitDateObj,
        status: 'REGISTERED',
        chiefComplaints: reason || null
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    // 3. Create Initial Bill (Consultation)
    await prisma.bill.create({
      data: {
        visitId: visit.id,
        amount: 200,
        type: 'CONSULTATION',
        paymentStatus: 'UNPAID',
        finalAmount: 200
      }
    });

    return NextResponse.json({ success: true, visit, isNewPatient, uhid: patient.uhid });
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
