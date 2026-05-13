import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { cookies } = await import('next/headers');
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    const session = JSON.parse(sessionCookie.value);

    const { visitId, tests } = await req.json(); // tests is an array of { name, price, category }

    // Verification: Ensure this visit belongs to the logged-in doctor
    if (session.role === 'DOCTOR') {
      const visitCheck = await prisma.visit.findUnique({ where: { id: visitId } });
      if (visitCheck && visitCheck.doctorId !== session.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
    }

    // 1. Create LabOrders
    const orders = await Promise.all(tests.map((test: any) => 
      prisma.labOrder.create({
        data: {
          visitId,
          testName: test.name,
          category: test.category || 'General',
          price: test.price,
          status: 'ORDERED'
        }
      })
    ));

    // 2. Create/Update Bill for Lab
    const totalLabAmount = tests.reduce((sum: number, t: any) => sum + t.price, 0);
    
    await prisma.bill.create({
      data: {
        visitId,
        amount: totalLabAmount,
        type: 'LAB',
        paymentStatus: 'UNPAID',
        finalAmount: totalLabAmount,
        labOrders: {
          connect: orders.map(o => ({ id: o.id }))
        }
      }
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
