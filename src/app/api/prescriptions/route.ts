import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { cookies } = await import('next/headers');
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    const session = JSON.parse(sessionCookie.value);

    const { visitId, drugs } = await req.json(); // drugs: [{ name, dosage, duration, instructions }]

    // Verification: Ensure this visit belongs to the logged-in doctor
    if (session.role === 'DOCTOR') {
      const visitCheck = await prisma.visit.findUnique({ where: { id: visitId } });
      if (visitCheck && visitCheck.doctorId !== session.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
    }

    const prescriptions = await Promise.all(drugs.map((drug: any) => 
      prisma.prescription.create({
        data: {
          visitId,
          drugName: drug.name || drug.drugName,
          dosage: drug.dosage,
          duration: drug.duration,
          instructions: drug.instructions,
          status: 'ORDERED'
        }
      })
    ));

    return NextResponse.json({ success: true, prescriptions });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const orders = await prisma.prescription.findMany({
      where: { status: 'ORDERED' },
      include: {
        visit: {
          include: {
            patient: true
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

export async function DELETE(req: Request) {
  try {
    const { cookies } = await import('next/headers');
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    const session = JSON.parse(sessionCookie.value);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    // Verification: Ensure this prescription belongs to a visit of the logged-in doctor
    if (session.role === 'DOCTOR') {
      const prescriptionCheck = await prisma.prescription.findUnique({ 
        where: { id },
        include: { visit: true }
      });
      if (prescriptionCheck && prescriptionCheck.visit.doctorId !== session.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
    }

    await prisma.prescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
