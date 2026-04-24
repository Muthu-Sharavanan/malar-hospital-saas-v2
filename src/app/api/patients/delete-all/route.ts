import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    if (body.password !== 'aravind55') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid password' }, { status: 401 });
    }

    // Cascade delete manually since Prisma schema does not define onDelete: Cascade here
    await prisma.$transaction([
      prisma.prescription.deleteMany(),
      prisma.labOrder.deleteMany(),
      prisma.surgery.deleteMany(),
      prisma.bill.deleteMany(),
      prisma.admission.deleteMany(),
      prisma.visit.deleteMany(),
      prisma.patient.deleteMany()
    ]);

    return NextResponse.json({ success: true, message: 'All patients entirely deleted' });
  } catch (error: any) {
    console.error("Delete All Patients Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
