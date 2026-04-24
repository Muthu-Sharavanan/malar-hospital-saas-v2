import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ billId: string }> }) {
  try {
    const { billId } = await params;

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        visit: {
          include: {
            patient: true,
            doctor: true
          }
        },
        labOrders: true
      }
    });

    if (!bill) {
        return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, bill });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
