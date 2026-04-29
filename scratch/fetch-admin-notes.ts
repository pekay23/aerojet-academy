import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const notes = await prisma.adminNote.findMany({
    include: {
      studentProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  const relevantNotes = notes.filter(n => {
    const l = n.content.toLowerCase();
    return l.includes('exam') || l.includes('module') || l.includes('write') || l.includes('interest');
  });

  console.log(JSON.stringify(relevantNotes, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
