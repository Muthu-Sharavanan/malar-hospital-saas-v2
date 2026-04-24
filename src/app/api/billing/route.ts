import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { 
      billId, visitId, type, 
      paymentMode, discount = 0, 
      waiverReason = '', authorizingDocId, paymentStatus = 'PAID',
      refundAmount = 0, refundReason = '',
      surgeryCharges = [] // [{itemName, amount}]
    } = await req.json();

    // CASE 1: CREATE NEW BILL (e.g. SURGERY)
    if (!billId && visitId && type === 'SURGERY') {
        const totalAmount = surgeryCharges.reduce((sum: number, item: any) => sum + item.amount, 0);
        const finalAmount = Math.max(0, totalAmount - discount);

        const bill = await prisma.bill.create({
            data: {
                visitId,
                type: 'SURGERY',
                amount: totalAmount,
                finalAmount,
                discount,
                paymentStatus,
                paymentMode,
                waiverReason,
                authorizingDocId: authorizingDocId || null,
                surgeryItemization: JSON.stringify(surgeryCharges)
            }
        });
        return NextResponse.json({ success: true, bill });
    }

    // CASE 2: UPDATE EXISTING BILL (Payment/Refund)
    const currentBill = await prisma.bill.findUnique({ 
      where: { id: billId }
    });
    if (!currentBill) throw new Error("Bill not found");

    if (paymentStatus === 'REFUNDED') {
      const bill = await prisma.bill.update({
        where: { id: billId },
        data: {
          paymentStatus: 'REFUNDED',
          refundAmount,
          refundReason,
          authorizingDocId: authorizingDocId || null
        }
      });
      return NextResponse.json({ success: true, bill });
    }

    const finalAmount = Math.max(0, currentBill.amount - discount);

    const bill = await prisma.bill.update({
      where: { id: billId },
      data: {
        paymentStatus,
        paymentMode,
        discount,
        finalAmount,
        waiverReason,
        authorizingDocId: authorizingDocId || null
      },
      include: {
        labOrders: true
      }
    });

    // 2. Activate lab orders associated with this bill
    if (bill.type === 'LAB') {
      await prisma.labOrder.updateMany({
        where: { billId: bill.id },
        data: { status: 'PAID' }
      });
    }

    return NextResponse.json({ success: true, bill });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
      where: {
        paymentStatus: { in: ['UNPAID', 'PAID'] } // Reception needs to see PAID bills to Refund them
      },
      include: {
        visit: {
          include: {
            patient: true
          }
        },
        labOrders: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ success: true, bills });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
