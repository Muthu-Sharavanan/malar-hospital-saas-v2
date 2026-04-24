import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ visitId: string }> }) {
  try {
    const { visitId } = await params;

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        doctor: true,
        prescriptions: true,
        labOrders: true
      }
    });

    if (!visit) {
        return NextResponse.json({ success: false, error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, visit });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
