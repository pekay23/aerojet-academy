import prisma from '../lib/prisma/client';
import fs from 'fs';

async function checkRecords() {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      include: {
        profile: true,
        studentProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const output = students.map(s => ({
      id: s.id,
      name: `${s.profile?.firstName} ${s.profile?.lastName}`,
      email: s.email,
      studentId: s.studentProfile?.studentId,
      programme: s.programmeChoice,
      createdAt: s.createdAt
    }));
    
    fs.writeFileSync('scratch/students.json', JSON.stringify(output, null, 2));
    console.log(`Wrote ${students.length} students to scratch/students.json`);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecords();
