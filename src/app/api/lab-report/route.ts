import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { orderId, reportData } = await req.json();

    const updatedOrder = await prisma.labOrder.update({
      where: { id: orderId },
      data: {
        reportData,
        status: 'REPORTED'
      }
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Fetch all lab orders that are PAID or WAIVED but not yet reported
    const labOrders = await prisma.labOrder.findMany({
      where: {
        status: { in: ['PAID', 'WAIVED', 'SAMPLE_COLLECTED'] }
      },
      include: {
        visit: {
          include: {
            patient: true,
            doctor: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ success: true, orders: labOrders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
