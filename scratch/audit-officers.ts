import prisma from '../lib/prisma/client';
import fs from 'fs';

async function auditOfficers() {
  try {
    const emails = [
      "d.archer@aerojet-academy.com",
      "a.adam@aerojet-academy.com",
      "d.korku@aerojet-academy.com",
      "f.ampeh@aerojet-academy.com",
      "b.bandor@aerojet-academy.com",
      "e.avege@aerojet-academy.com",
      "p.wiafe@aerojet-academy.com",
      "e.kwarteng@aerojet-academy.com"
    ];

    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      include: {
        profile: true,
        studentProfile: true,
        wallet: { include: { transactions: true } },
        examBookings: { orderBy: { createdAt: 'asc' } },
        examResults: { orderBy: { createdAt: 'asc' } },
        examAttendances: { orderBy: { createdAt: 'asc' } },
        bookingEntitlements: true,
        enrollments: true,
        grades: true
      }
    });

    const audit = users.map(u => ({
      name: `${u.profile?.firstName} ${u.profile?.lastName}`,
      email: u.email,
      personalEmail: u.personalEmail,
      id: u.id,
      studentId: u.studentProfile?.studentId,
      programme: u.programmeChoice,
      wallet: u.wallet ? {
        id: u.wallet.id,
        balance: u.wallet.balance.toString(),
        reserved: u.wallet.reservedBalance.toString(),
        available: u.wallet.availableBalance.toString(),
        txnCount: u.wallet.transactions.length,
        transactions: u.wallet.transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount.toString(),
          description: t.description,
          createdAt: t.createdAt
        }))
      } : null,
      bookings: u.examBookings.map(b => ({
        id: b.id,
        moduleCode: b.moduleCode,
        examComponentId: b.examComponentId,
        status: b.status,
        bookingType: b.bookingType,
        amountPaid: b.amountPaid.toString(),
        result: b.result,
        score: b.score?.toString(),
        isResit: b.isResit,
        combinedGroupRef: b.combinedGroupRef,
        bookingGroupRef: b.bookingGroupRef,
        attemptType: b.attemptType,
        createdAt: b.createdAt
      })),
      results: u.examResults.map(r => ({
        id: r.id,
        examId: r.examId,
        moduleCode: r.moduleCode,
        score: r.score?.toString(),
        percentage: r.percentage?.toString(),
        passed: r.passed,
        attemptNumber: r.attemptNumber,
        createdAt: r.createdAt
      })),
      entitlements: u.bookingEntitlements.map(e => ({
        id: e.id,
        type: e.type,
        totalResits: (e as any).includedFreeResits,
        usedResits: (e as any).usedFreeResits,
      })),
      attendances: u.examAttendances.length,
      enrollments: u.enrollments.length,
      grades: u.grades.length
    }));

    fs.writeFileSync('scratch/officer-audit.json', JSON.stringify(audit, null, 2));
    console.log(`Full audit written to scratch/officer-audit.json`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

auditOfficers();
