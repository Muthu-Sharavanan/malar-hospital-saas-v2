import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only admins can reassign visits' }, { status: 403 });
    }

    const { visitId, targetDoctorId } = await req.json();

    if (!visitId || !targetDoctorId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const targetDoctor = await prisma.user.findUnique({ where: { id: targetDoctorId } });
    if (!targetDoctor) return NextResponse.json({ success: false, error: 'Target doctor not found' }, { status: 404 });

    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: { 
        doctorId: targetDoctorId,
        assignedDoctorName: targetDoctor.name
      }
    });

    return NextResponse.json({ success: true, message: `Visit reassigned to ${targetDoctor.name}`, visit: updatedVisit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
