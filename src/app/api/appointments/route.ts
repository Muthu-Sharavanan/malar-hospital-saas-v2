import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { cookies } = await import('next/headers');
    const sessionCookie = (await cookies()).get('session');

    let sessionName = '';
    let sessionRole = '';
    
    let session: any = null;
    
    // Attempt to get doctor filter from session
    if (sessionCookie) {
      try {
        session = JSON.parse(decodeURIComponent(sessionCookie.value));
        sessionRole = session.role || '';
        sessionName = (session.name || '').toLowerCase().trim().replace(/^(dr\.?\s*)+/i, '');
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    // Determine query filtering based on session (only show mapped doctor's visits)
    // If no session passed or admin/receptionist, show all, but doctor dashboard requires session filter.
    const whereClause = (sessionRole === 'DOCTOR' && session?.id) ? {
      doctorId: session.id
    } : {};

    // Get all visits (past, present, future) for the calendar
    const visits = await prisma.visit.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        labOrders: true,
        prescriptions: true
      },
      orderBy: {
        visitDate: 'asc'
      }
    });

    return NextResponse.json({ success: true, visits });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
