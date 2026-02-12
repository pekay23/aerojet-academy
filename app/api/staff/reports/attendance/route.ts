import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  try {
    // 1. Fetch all attendance records
    const records = await prisma.attendanceRecord.findMany({
      include: {
        student: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    // 2. Aggregate Data by Student
    const studentStats = new Map();

    records.forEach(record => {
      const studentId = record.studentId;
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          id: studentId,
          name: record.student.user.name,
          totalClasses: 0,
          present: 0,
          absent: 0,
          lateCount: 0,
          lateMinutes: 0
        });
      }

      const stats = studentStats.get(studentId);
      stats.totalClasses++;

      if (record.status === 'PRESENT') stats.present++;
      if (record.status.includes('ABSENT')) stats.absent++;
      if (record.status === 'LATE') {
        stats.lateCount++;
        stats.lateMinutes += (record.lateMinutes || 0);
      }
    });

    // 3. Convert to Array and Calculate Risks
    const report = Array.from(studentStats.values()).map((s: any) => ({
      ...s,
      attendanceRate: Math.round((s.present / s.totalClasses) * 100),
      riskLevel: s.attendanceRate < 85 ? 'CRITICAL' : (s.lateCount > 3 ? 'WARNING' : 'GOOD')
    }));

    return NextResponse.json({ report });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
