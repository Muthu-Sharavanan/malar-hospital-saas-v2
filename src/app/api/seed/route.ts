import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const oldEmail = 'doctor@malar.com';
    const newEmail = 'ramaswamy@malar.com';

    // 1. Ensure the NEW user exists first so we have a valid target ID
    const newUser = await prisma.user.upsert({
      where: { email: newEmail },
      update: {
        name: 'Dr. Ramaswamy',
        password: 'password123',
        role: 'DOCTOR'
      },
      create: {
        name: 'Dr. Ramaswamy',
        email: newEmail,
        password: 'password123',
        role: 'DOCTOR'
      }
    });

    // 2. Find the old user
    const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });

    if (oldUser && oldUser.id !== newUser.id) {
      console.log(`Reassigning data from ${oldUser.id} to ${newUser.id}...`);
      
      // Use a transaction to ensure all-or-nothing reassignment
      await prisma.$transaction([
        prisma.visit.updateMany({
          where: { doctorId: oldUser.id },
          data: { doctorId: newUser.id }
        }),
        prisma.surgery.updateMany({
          where: { surgeonId: oldUser.id },
          data: { surgeonId: newUser.id }
        }),
        prisma.bill.updateMany({
          where: { authorizingDocId: oldUser.id },
          data: { authorizingDocId: newUser.id }
        }),
        // DELETE the old user only after everything is reassigned
        prisma.user.delete({
          where: { id: oldUser.id }
        })
      ]);
      console.log("Reassignment and legacy account deletion successful.");
    }

    // 3. CLEANUP: Delete all test data for a fresh demo
    console.log("Cleaning up test data...");
    await prisma.$transaction([
      prisma.prescription.deleteMany({}),
      prisma.labOrder.deleteMany({}),
      prisma.bill.deleteMany({}),
      prisma.visit.deleteMany({}),
      prisma.admission.deleteMany({}),
      prisma.surgery.deleteMany({}),
      prisma.patient.deleteMany({}), // Clean slate for patients too
    ]);

    // 4. SEED: Essential Users
    const users = [
      { name: 'Dr. Ramaswamy', email: 'ramaswamy@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Dr. Aravind', email: 'aravind@malar.com', password: 'password123', role: 'DOCTOR' },
      { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
      { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
      { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
      { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
      { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, password: user.password, role: user.role as any },
        create: { name: user.name, email: user.email, password: user.password, role: user.role as any }
      });
    }

    // 5. SEED: Professional Demo Patients
    const demoPatients = [
      { id: 'p1', uhid: 'MH-10001', name: 'S. MEENAKSHI', age: 45, gender: 'Female', phone: '9840123456', address: 'Anna Nagar, Thoothukudi' },
      { id: 'p2', uhid: 'MH-10002', name: 'RAJESH KUMAR', age: 38, gender: 'Male', phone: '9443210987', address: 'Beach Road, Thoothukudi' },
      { id: 'p3', uhid: 'MH-10003', name: 'ABDUL RAHMAN', age: 29, gender: 'Male', phone: '9786543210', address: 'New Colony, Srivaikuntam' },
    ];

    for (const p of demoPatients) {
      await prisma.patient.create({ data: p });
    }

    // 6. SEED: Clinical Activity for the "Perfect Show" (Last 7 Days)
    console.log("Generating clinical demo data...");
    const today = new Date();
    const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    const doctorId = doctor?.id || 'default-doc';

    // Helper to generate dates over last 7 days
    const days = [0, 1, 2, 3, 4, 5, 6];
    for (const day of days) {
        const date = new Date();
        date.setDate(today.getDate() - day);
        
        // 3-5 visits per day
        const dailyCount = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < dailyCount; i++) {
            const patientId = demoPatients[i % 3].id;
            const visit = await prisma.visit.create({
                data: {
                    patientId,
                    doctorId,
                    tokenNumber: i + 1,
                    status: i % 2 === 0 ? 'COMPLETED' : 'REGISTERED',
                    createdAt: date,
                    visitDate: date
                }
            });

            // Randomly add a lab order or surgery for distribution variety
            if (i === 0) {
                await prisma.labOrder.create({
                    data: {
                        visitId: visit.id,
                        testName: 'Complete Blood Count',
                        category: 'HEMATOLOGY',
                        price: 0, // No money
                        status: 'PENDING',
                        createdAt: date
                    }
                });
            } else if (i === 1) {
                const admission = await prisma.admission.create({
                    data: {
                        visitId: visit.id,
                        patientId,
                        status: 'ADMITTED',
                        createdAt: date
                    }
                });
                await prisma.surgery.create({
                    data: {
                        admissionId: admission.id,
                        surgeryName: 'Minor Suturing',
                        surgeonId: doctorId,
                        surgeryDate: date,
                        status: 'COMPLETED',
                        totalFees: 0, // No money
                        createdAt: date
                    }
                });
            }
        }
    }

    return NextResponse.json({ 
      success: true, 
      message: "LIVE RESET SUCCESSFUL! Clinical demo data (15+ visits, labs, surgeries) has been generated for a Perfect Admin Show.",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
