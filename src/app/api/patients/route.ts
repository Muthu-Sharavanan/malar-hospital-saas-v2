import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    // All-patients mode (for Admin panel)
    if (all) {
      const where = query
        ? {
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } },
              { uhid: { contains: query } },
              { address: { contains: query } },
            ],
          }
        : {};

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { visits: true } },
          },
        }),
        prisma.patient.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        patients,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Search mode (for Reception dropdown)
    if (!query) {
      return NextResponse.json({ success: true, patients: [] });
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } },
          { uhid: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    return handleApiError(error, 'GET patients');
  }
}
