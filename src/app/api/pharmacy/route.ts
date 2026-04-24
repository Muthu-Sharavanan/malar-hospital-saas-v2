import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { visitId, prescriptionIds, totalAmount } = await req.json();

    // 1. Mark prescriptions as DISPENSED
    await prisma.prescription.updateMany({
      where: { id: { in: prescriptionIds } },
      data: { status: 'DISPENSED' }
    });

    // 2. Create Pharmacy Bill
    await prisma.bill.create({
      data: {
        visitId,
        amount: totalAmount,
        type: 'PHARMACY',
        paymentStatus: 'UNPAID',
        finalAmount: totalAmount
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Group prescriptions by visit
    const orders = await prisma.prescription.findMany({
      where: { status: 'ORDERED' },
      include: {
        visit: {
          include: {
            patient: true,
            doctor: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
