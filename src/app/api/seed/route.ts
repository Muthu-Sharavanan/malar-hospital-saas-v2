import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. CLEAR DATA for a fresh start
    console.log("Cleaning up data...");
    await prisma.$transaction([
      prisma.prescription.deleteMany({}),
      prisma.labOrder.deleteMany({}),
      prisma.bill.deleteMany({}),
      prisma.visit.deleteMany({}),
      prisma.admission.deleteMany({}),
      prisma.surgery.deleteMany({}),
      prisma.patient.deleteMany({}),
      prisma.user.deleteMany({}), // Clean slate for users too
    ]);

    // 2. SEED: Essential Users
    const users = [
      { name: 'Dr. Ramaswamy', email: 'ramaswamy@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Dr. Aravind', email: 'aravind@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
      { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
      { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
      { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
      { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
    ];

    const hashedPassword = await bcrypt.hash('password123', 12);

    for (const user of users) {
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "LIVE RESET SUCCESSFUL! Staff accounts have been created. You can now log in with password123." 
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
