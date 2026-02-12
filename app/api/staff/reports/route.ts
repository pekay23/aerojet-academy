import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes((session.user as { role: string }).role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'finance';

    try {
        if (type === 'finance') {
            const [totalRevenue, outstandingFees, paidFees, unpaidFees, verifyingFees, feesByDescription] = await Promise.all([
                prisma.fee.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
                prisma.fee.aggregate({ where: { status: { in: ['UNPAID', 'VERIFYING'] } }, _sum: { amount: true } }),
                prisma.fee.count({ where: { status: 'PAID' } }),
                prisma.fee.count({ where: { status: 'UNPAID' } }),
                prisma.fee.count({ where: { status: 'VERIFYING' } }),
                prisma.fee.groupBy({
                    by: ['description'],
                    _sum: { amount: true },
                    _count: true,
                    where: { status: 'PAID' }
                })
            ]);

            return NextResponse.json({
                type: 'finance',
                totalRevenue: totalRevenue._sum.amount || 0,
                outstandingAmount: outstandingFees._sum.amount || 0,
                counts: { paid: paidFees, unpaid: unpaidFees, verifying: verifyingFees },
                byDescription: feesByDescription.map(g => ({
                    description: g.description,
                    total: g._sum.amount || 0,
                    count: g._count
                }))
            });
        }

        if (type === 'students') {
            const [total, active, byGender, byStatus, recent] = await Promise.all([
                prisma.user.count({ where: { role: 'STUDENT', isDeleted: false } }),
                prisma.user.count({ where: { role: 'STUDENT', isActive: true, isDeleted: false } }),
                prisma.student.groupBy({ by: ['gender'], _count: true }),
                prisma.student.groupBy({ by: ['enrollmentStatus'], _count: true }),
                prisma.student.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { name: true, email: true, createdAt: true } } }
                })
            ]);

            return NextResponse.json({
                type: 'students',
                total, active,
                byGender: byGender.map(g => ({ gender: g.gender || 'Unspecified', count: g._count })),
                byStatus: byStatus.map(g => ({ status: g.enrollmentStatus, count: g._count })),
                byProgramme: [], // 'programme' field logic removed as it does not correspond to schema
                recent: recent.map(s => ({
                    name: s.user.name,
                    email: s.user.email,
                    status: s.enrollmentStatus,
                    enrolled: s.user.createdAt
                }))
            });
        }

        if (type === 'exams') {
            const [totalResults, passResults, pools] = await Promise.all([
                prisma.assessment.count(),
                prisma.assessment.count({ where: { isPassed: true } }),
                prisma.examPool.findMany({
                    include: {
                        _count: { select: { memberships: true } },
                        event: { select: { name: true } }
                    },
                    orderBy: { examDate: 'desc' },
                    take: 10
                })
            ]);

            return NextResponse.json({
                type: 'exams',
                totalResults,
                passCount: passResults,
                passRate: totalResults > 0 ? ((passResults / totalResults) * 100).toFixed(1) : 0,
                recentPools: pools.map(p => ({
                    name: p.name,
                    course: p.event.name, // Use event name as proxy for context
                    date: p.examDate,
                    seats: p._count.memberships,
                    capacity: p.maxCandidates
                }))
            });
        }

        if (type === 'attendance') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const [records, byCourse] = await Promise.all([
                prisma.attendanceRecord.findMany({
                    where: { date: { gte: thirtyDaysAgo } },
                    select: { status: true, date: true }
                }),
                prisma.attendanceRecord.groupBy({
                    by: ['courseId'],
                    where: { date: { gte: thirtyDaysAgo } },
                    _count: true
                })
            ]);

            const present = records.filter(r => r.status === 'PRESENT').length;
            const absent = records.filter(r => ['ABSENT_EXCUSED', 'ABSENT_UNEXCUSED'].includes(r.status)).length;
            const late = records.filter(r => r.status === 'LATE').length;

            return NextResponse.json({
                type: 'attendance',
                total: records.length,
                present, absent, late,
                rate: records.length > 0 ? ((present / records.length) * 100).toFixed(1) : 0,
                byCourse: byCourse
            });
        }

        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    } catch (error) {
        console.error('REPORTS_ERROR:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
