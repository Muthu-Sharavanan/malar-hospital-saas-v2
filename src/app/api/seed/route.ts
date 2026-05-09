import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const logs: string[] = [];
  try {
    logs.push("Starting database initialization...");

    // 1. Create Users (The most important part)
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
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name, password: hashedPassword, role: user.role },
          create: { name: user.name, email: user.email, password: hashedPassword, role: user.role }
        });
        logs.push(`Successfully synced user: ${user.email}`);
      } catch (e: any) {
        logs.push(`Failed to sync user ${user.email}: ${e.message}`);
      }
    }

    // 2. Try to create a test patient to see if schema exists
    try {
        await prisma.patient.upsert({
            where: { uhid: 'TEST-1' },
            update: {},
            create: { uhid: 'TEST-1', name: 'Test Patient', age: 0, gender: 'Other' }
        });
        logs.push("Database schema verified (Patient table exists).");
    } catch (e: any) {
        logs.push("SCHEMA ERROR: The database tables do not exist. You MUST run 'npx prisma db push' using the production DATABASE_URL.");
    }

    return NextResponse.json({ 
      success: true, 
      logs,
      message: "Database sync attempted. Check logs above to see if users were created." 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}
