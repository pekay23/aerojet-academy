import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Security Check: Only Admin and Staff allowed
    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // --- 2. STUDENT DEMOGRAPHICS ---
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const activeStudents = await prisma.user.count({ where: { role: 'STUDENT', isActive: true } });
    const inactiveStudents = totalStudents - activeStudents;

    // Queries the Student table for gender (assumes profile exists)
    const maleStudents = await prisma.student.count({ where: { gender: 'MALE' } });
    const femaleStudents = await prisma.student.count({ where: { gender: 'FEMALE' } });

    // --- 3. TEAM STATS ---
    const totalStaff = await prisma.user.count({ where: { role: 'STAFF' } });
    const totalInstructors = await prisma.user.count({ where: { role: 'INSTRUCTOR' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });

    // --- 4. OPERATIONAL STATS ---
    const pendingApps = await prisma.application.count({ where: { status: 'PENDING' } });
    const verifyingPayments = await prisma.fee.count({ where: { status: 'VERIFYING' } });

    // --- 5. EXAM WINDOW TRACKER LOGIC ---
    const nextWindow = await prisma.examWindow.findFirst({
      where: { endDate: { gt: new Date() } },
      include: {
        runs: {
          include: {
            course: true,
            bookings: {
              include: { 
                student: { include: { fees: true } } 
              }
            }
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    let windowStats = null;

    if (nextWindow) {
      let paidSeatsCount = 0;
      nextWindow.runs.forEach(run => {
        run.bookings.forEach(booking => {
          // Verify if student has a fee record matching the module code that is marked PAID
          const examFee = booking.student.fees.find(f => 
            f.description?.includes(run.course.code) && f.status === 'PAID'
          );
          if (examFee) {
            paidSeatsCount++;
          }
        });
      });

      const today = new Date();
      const cutoff = new Date(nextWindow.cutoffDate);
      const diffTime = cutoff.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      windowStats = {
        id: nextWindow.id,
        name: nextWindow.name,
        cutoff: nextWindow.cutoffDate,
        paidSeats: paidSeatsCount,
        targetSeats: nextWindow.minSeatsRequired,
        isGo: paidSeatsCount >= nextWindow.minSeatsRequired,
        daysToCutoff: diffDays > 0 ? diffDays : 0
      };
    }

    // --- 6. FINAL RESPONSE ---
    return NextResponse.json({
      studentStats: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        male: maleStudents,
        female: femaleStudents
      },
      teamStats: {
        staff: totalStaff,
        instructors: totalInstructors,
        admins: totalAdmins
      },
      opsStats: {
        pendingApps,
        verifyingPayments
      },
      windowTracker: windowStats 
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
