import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const student = await prisma.student.findUnique({
            where: { userId }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const body = await req.json();
        const { program, educationLevel, institutionName, idDocumentUrl, certificateUrl } = body;

        let course = await prisma.course.findFirst({
            where: { title: { contains: 'Aircraft Engineering', mode: 'insensitive' } }
        });

        if (!course) {
            course = await prisma.course.create({
                data: {
                    code: 'AME-FULL',
                    title: 'Aircraft Maintenance Engineering (Full-Time)',
                    price: 2500.00,
                    duration: '4 Years'
                }
            });
        }

        const application = await prisma.application.create({
            data: {
                studentId: student.id,
                courseId: course.id,
                educationLevel,
                institutionName,
                idDocumentUrl,
                certificateUrl,
                isSubmitted: true,
                status: 'PENDING'
            }
        });

        if (program === 'Full-Time') {
            const tuition = Number(course.price) || 2500.00;
            const minDeposit = tuition * 0.40;

            // Use the higher of the two: custom amount or minimum required
            const { depositAmount } = body;
            const finalDeposit = Math.max(Number(depositAmount) || 0, minDeposit);

            await prisma.fee.create({
                data: {
                    studentId: student.id,
                    amount: finalDeposit,
                    description: `Seat Confirmation Deposit (${finalDeposit > minDeposit ? 'Custom Amount' : '40%'})`,
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    status: 'UNPAID'
                }
            });
        }

        return NextResponse.json({ success: true, applicationId: application.id });

    } catch (error) {
        console.error('Submit Application Error:', error);
        return NextResponse.json({ error: 'Application submission failed' }, { status: 500 });
    }
}
