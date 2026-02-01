import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import Image from "next/image";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/portal/login');
  }

  if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
    redirect('/staff/dashboard');
  }

  // Fetch Student Data with Attendance
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      fees: true,
      examBookings: {
        include: { run: { include: { course: true } } },
        where: { run: { startDatetime: { gt: new Date() } } },
        orderBy: { run: { startDatetime: 'asc' } },
        take: 1
      },
      applications: true,
      attendance: true // Fetch attendance records
    }
  });

  const isProfileComplete = !!(student?.phone && student?.address && student?.emergencyName);
  const studentId = student?.studentId || "PENDING";
  
  const outstandingBalance = student?.fees
    .filter(f => f.status !== 'PAID' && f.status !== 'CLEARED')
    .reduce((acc, curr) => acc + curr.amount, 0) || 0;

  const appStatus = student?.applications[0]?.status || "Not Started";

  const nextExam = student?.examBookings[0] 
    ? `${student.examBookings[0].run.course.code} - ${new Date(student.examBookings[0].run.startDatetime).toLocaleDateString()}`
    : "No exams booked";

  // --- ATTENDANCE CALCULATION ---
  const totalScheduled = student?.attendance.reduce((acc, rec) => acc + rec.scheduledHours, 0) || 0;
  const totalAttended = student?.attendance.reduce((acc, rec) => acc + rec.attendedHours, 0) || 0;
  const totalLateMins = student?.attendance.reduce((acc, rec) => acc + rec.lateMinutes, 0) || 0;
  
  // Logic: Late hours count as absence? Or just tracked?
  // Your spec: "5 hours late -> 2 days absence".
  // Let's assume standard day is 6 hours for calculation if not specified, or use the course avg.
  const hoursPerDay = 6; 
  
  const lateHours = totalLateMins / 60;
  const rawAbsentHours = totalScheduled - totalAttended;
  const totalEffectiveAbsentHours = rawAbsentHours + lateHours;
  
  const derivedAbsentDays = totalEffectiveAbsentHours / hoursPerDay;
  
  // Percentage: (Attended / Scheduled) * 100 
  // (We usually don't subtract lateness from the raw % unless specified, but we display the derived days)
  const attendancePct = totalScheduled > 0 ? ((totalAttended / totalScheduled) * 100).toFixed(1) : "100";

  return (
    <div className="space-y-8">
      {/* 1. Welcome Section */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
            <div 
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-aerojet-sky shadow-md"
                onContextMenu={(e) => e.preventDefault()}
            >
                {student?.photoUrl ? (
                    <Image src={student.photoUrl} alt="ID" layout="fill" objectFit="cover" quality={5} className="pointer-events-none" />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-2xl">
                        {session.user.name?.[0]}
                    </div>
                )}
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-aerojet-blue">
                    Welcome, {session.user.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-500 mt-1">
                    Student ID: <span className={`font-mono font-bold ${studentId === 'PENDING' ? 'text-orange-500' : 'text-aerojet-sky'}`}>{studentId}</span>
                </p>
            </div>
        </div>
        
        <div className="w-full md:w-auto bg-blue-50 px-5 py-3 rounded-lg border border-blue-100">
          <p className="text-xs text-aerojet-blue uppercase font-bold tracking-wider mb-1">Current Intake</p>
          <p className="text-lg font-bold text-aerojet-sky">{student?.cohort || "Sept 2026 (TBC)"}</p>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Attendance Card (NEW) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-700">Attendance</h3>
                <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-aerojet-blue">{attendancePct}%</p>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>Late: <span className="font-bold text-red-500">{lateHours.toFixed(1)} hrs</span></p>
                <p>Est. Absence: <span className="font-bold text-red-500">{derivedAbsentDays.toFixed(1)} days</span></p>
            </div>
        </div>

        {/* Financials */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${outstandingBalance > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-700">Finance</h3>
            <span className="text-2xl">💳</span>
          </div>
          <p className="text-2xl font-bold text-aerojet-blue">GHS {outstandingBalance.toFixed(0)}</p>
          <Link href="/portal/finance" className="text-xs text-aerojet-sky hover:underline mt-2 inline-block">
            View Ledger &rarr;
          </Link>
        </div>

        {/* Application Status */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${appStatus === 'APPROVED' ? 'border-l-green-500' : 'border-l-yellow-400'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-700">Status</h3>
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-xl font-bold text-aerojet-blue capitalize">{appStatus === 'PENDING' ? 'Under Review' : appStatus}</p>
        </div>

        {/* Next Event */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-aerojet-blue">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-700">Next Exam</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-sm font-bold text-aerojet-blue line-clamp-2">{nextExam}</p>
        </div>
      </div>

      {/* 3. Action Required */}
      {!isProfileComplete && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
          <div className="bg-red-600 px-6 py-3 border-b border-red-700">
            <h3 className="text-white font-bold text-lg">Action Required</h3>
          </div>
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">!</div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Complete Your Student Profile</h4>
                <p className="text-gray-600 mt-1">We need your phone number, address, and emergency contact details.</p>
              </div>
            </div>
            <Link href="/portal/profile" className="w-full md:w-auto text-center bg-aerojet-sky text-white px-8 py-3 rounded-lg font-bold hover:bg-aerojet-soft-blue transition whitespace-nowrap shadow-md">
              Complete Profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
