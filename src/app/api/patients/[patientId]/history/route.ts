import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params;

    const history = await prisma.visit.findMany({
      where: { patientId },
      include: {
        doctor: true,
        prescriptions: true,
        labOrders: true,
      },
      orderBy: { visitDate: 'desc' }
    });

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, patient, history });
  } catch (error: any) {
    console.error("History Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
