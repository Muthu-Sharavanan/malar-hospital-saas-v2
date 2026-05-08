import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, customName } = body;

    // DEBUG LOGGING
    console.log(`[LOGIN] Email: ${email}, Role check pending...`);

    // 1. Find user by email first
    const user = await prisma.user.findFirst({ where: { email } });
    
    if (!user) {
       return NextResponse.json({ success: false, error: "Email address not found" }, { status: 401 });
    }

    // 2. Check Password using Bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
       return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 401 });
    }

    // 3. Handle Name-based restrictions
    const cleanedSearch = customName ? customName.toLowerCase().trim().replace(/^(dr\.?\s*)+/i, '') : '';

    if (user.role === 'DOCTOR') {
      if (!cleanedSearch) {
        console.error(`[LOGIN] Doctor name missing for ${email}. Provided name: "${customName}"`);
        return NextResponse.json({ success: false, error: "Doctor Name is required" }, { status: 400 });
      }

      const allowedDoctors = ['aravind', 'ramaswamy'];
      if (!allowedDoctors.includes(cleanedSearch)) {
        console.warn(`[LOGIN] Unauthorized doctor name: "${cleanedSearch}" for email ${email}`);
        return NextResponse.json({ 
          success: false, 
          error: "Unauthorized: Only Dr. Aravind and Dr. Ramaswamy are registered for this portal." 
        }, { status: 403 });
      }

      // Also ensure the customName matches the record in the DB for doctors
      if (!user.name.toLowerCase().includes(cleanedSearch)) {
        return NextResponse.json({ success: false, error: `Name "${customName}" does not match our records for this email.` }, { status: 401 });
      }
    }

    // Set a simple cookie (In a production app, use JWT and iron-session)
    let displayName = customName || user.name;
    
    // ENSURE CORRECT DOCTOR NAMES FOR DEMO
    if (user.role === 'DOCTOR') {
      if (email.includes('ramaswamy')) displayName = 'Ramaswamy';
      else if (email.includes('aravind')) displayName = 'Aravind';
    }

    const sessionData = JSON.stringify({ id: user.id, role: user.role, name: displayName });
    (await cookies()).set('session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return NextResponse.json({ success: true, user: { name: user.name, role: user.role } });
  } catch (error: any) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
