import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { 
      visitId, pulse, bloodPressure, spo2, temperature, 
      weight, height, bmi 
    } = await req.json();

    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: {
        pulse: parseInt(pulse),
        bloodPressure,
        spo2: parseInt(spo2),
        temperature: parseFloat(temperature),
        weight: parseFloat(weight),
        height: parseFloat(height),
        bmi: parseFloat(bmi),
        status: 'VITALS_DONE'
      }
    });

    return NextResponse.json({ success: true, visit: updatedVisit });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const session = url.searchParams.get('session'); // morning | evening
    const includePast = url.searchParams.get('includePast') === 'true';

    // Timezone-aware date window (IST is UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    const todayStart = new Date(istNow);
    todayStart.setUTCHours(0, 0, 0, 0);
    todayStart.setTime(todayStart.getTime() - istOffset); // Map back to UTC start
    
    const todayEnd = new Date(todayStart);
    todayEnd.setTime(todayEnd.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Fetch patients waiting for vitals
    const queue = await prisma.visit.findMany({
      where: {
        status: 'REGISTERED',
        visitDate: includePast ? {
          lte: todayEnd // All pending up to today
        } : {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        patient: true,
        doctor: true
      },
      orderBy: {
        tokenNumber: 'asc'
      }
    });

    const enrichedQueue = queue.map(v => {
      const istDate = new Date(new Date(v.visitDate).getTime() + 5.5 * 60 * 60 * 1000);
      const hours = istDate.getUTCHours();
      const sessionLabel = hours < 12 ? 'morning' : 'evening';
      return { ...v, session: sessionLabel };
    });
    
    let filteredQueue = session 
      ? enrichedQueue.filter(v => v.session === session.toLowerCase())
      : enrichedQueue;

    return NextResponse.json({ success: true, queue: filteredQueue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
