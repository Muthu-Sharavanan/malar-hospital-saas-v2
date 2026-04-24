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
    
    // Attempt to get doctor filter from session
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie.value);
      sessionRole = session.role || '';
      sessionName = (session.name || '').toLowerCase().trim().replace(/^(dr\.?\s*)+/, '');
    }

    // Determine query filtering based on session (only show mapped doctor's visits)
    // If no session passed or admin/receptionist, show all, but doctor dashboard requires session filter.
    const whereClause = (sessionRole === 'DOCTOR' && sessionName) ? {
      OR: [
        {
          assignedDoctorName: {
            contains: sessionName,
            mode: 'insensitive' as const
          }
        },
        {
          doctor: {
            name: {
              contains: sessionName,
              mode: 'insensitive' as const
            }
          }
        }
      ]
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
