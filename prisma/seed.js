import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Dr. Ramasamy', email: 'doctor@malar.com', password: 'password123', role: 'DOCTOR' },
    { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
    { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
    { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
    { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
    { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log('Seed successful: Users created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
