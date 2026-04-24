import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from 'date-fns';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    const yesterday = subDays(today, 1);
    const yStart = startOfDay(yesterday);
    const yEnd = endOfDay(yesterday);

    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // 1. New Registrations (Today, Month)
    const totalPatients = await prisma.patient.count({
      where: { createdAt: { gte: start, lte: end } }
    });

    const totalPatientsMonth = await prisma.patient.count({
      where: { createdAt: { gte: monthStart, lte: monthEnd } }
    });

    // 2. Active Patients (Anyone with a visit today)
    const activeToday = await prisma.visit.count({
      where: { createdAt: { gte: start, lte: end } }
    });

    // 3. Completed Consultations
    const completedCount = await prisma.visit.count({
      where: { 
        createdAt: { gte: start, lte: end },
        status: 'COMPLETED'
      }
    });

    // 4. Pending Labs (Visits with lab orders but no report yet)
    const pendingLabs = await prisma.labOrder.count({
      where: { status: 'PENDING' }
    });

    // 5. Patient Type Breakdown (Today)
    const opdCount = await prisma.visit.count({
      where: { createdAt: { gte: start, lte: end } }
    });

    const labCount = await prisma.labOrder.count({
      where: { createdAt: { gte: start, lte: end } }
    });
    
    const surgeryCount = await prisma.surgery.count({
      where: { createdAt: { gte: start, lte: end } }
    });

    const visitBreakdown = {
      'OPD': opdCount,
      'LAB': labCount,
      'SURGERY': surgeryCount
    };

    // 6. 7-Day Trend for Patient Volume
    const sevenDays = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
    const trend = await Promise.all(sevenDays.map(async (date) => {
      const dStart = startOfDay(date);
      const dEnd = endOfDay(date);
      const count = await prisma.patient.count({
        where: { createdAt: { gte: dStart, lte: dEnd } }
      });
      return {
        date: format(date, 'MMM dd'),
        count: count
      };
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients,
        totalPatientsMonth,
        activeToday,
        completedCount,
        pendingLabs,
        visitBreakdown,
        sevenDayTrend: trend
      }
    });
  } catch (error: any) {
    console.error("Admin stats fetch failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

