import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // 1. Fetch Courses (and count enrolled students for "Class Size" feel)
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { applications: true } } // Count current applicants
      }
    });

    // 2. Fetch Active Exam Pools (with capacity)
    const pools = await prisma.examPool.findMany({
      where: { status: { in: ['OPEN', 'NEARLY_FULL'] } },
      orderBy: { examDate: 'asc' }
    });

    // 3. Format Data
    const catalog = {
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        code: c.code,
        price: c.price,
        enrolled: c._count.applications,
        type: 'COURSE'
      })),
      exams: pools.map(p => ({
        id: p.id,
        title: p.name,
        date: p.examDate,
        price: 490.00, // Or p.template.price
        capacity: p.maxCandidates,
        filled: p.currentCount,
        type: 'EXAM'
      }))
    };

    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
  }
}
