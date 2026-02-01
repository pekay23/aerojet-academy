import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import ProtectedImage from "@/components/portal/ProtectedImage"; 

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/portal/login');
  }

  // --- FORCE ADMIN REDIRECT ---
  if (session.user.role === 'ADMIN' || session.user.role === 'STAFF' || session.user.role === 'INSTRUCTOR') {
    redirect('/staff/dashboard');
  }

  // --- Fetch Student Data ---
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      fees: true,
      examBookings: {
        include: { run: { include: { course: true } } },
        where: { run: { startDatetime: { gt: new Date() } } },
        orderBy: { run: { startDatetime: 'asc' } },
        take: 3 // UPDATED: Show up to 3 upcoming exams
      },
      applications: {
        include: { course: true },
        orderBy: { appliedAt: 'desc' }
      },
      attendance: true 
    }
  });

  // --- Logic Checks ---
  const isProfileComplete = !!(student?.phone && student?.address && student?.emergencyName);
  const studentId = student?.studentId || "PENDING";
  
  const outstandingBalance = student?.fees
    .filter(f => f.status !== 'PAID' && f.status !== 'CLEARED')
    .reduce((acc, curr) => acc + curr.amount, 0) || 0;

  const latestApp = student?.applications[0];
  const appStatus = latestApp?.status || "Not Started";

  // Filter for approved courses that have material links
  const approvedMaterials = student?.applications
    .filter(app => app.status === 'APPROVED' && app.course.materialLink)
    .map(app => app.course) || [];

  // --- ATTENDANCE CALCULATION ---
  const totalScheduled = student?.attendance.reduce((acc, rec) => acc + rec.scheduledHours, 0) || 0;
  const totalAttended = student?.attendance.reduce((acc, rec) => acc + rec.attendedHours, 0) || 0;
  const totalLateMins = student?.attendance.reduce((acc, rec) => acc + rec.lateMinutes, 0) || 0;
  
  const hoursPerDay = 2.5; 
  const lateHours = totalLateMins / 60;
  const rawAbsentHours = totalScheduled - totalAttended;
  const totalEffectiveAbsentHours = rawAbsentHours + lateHours;
  const derivedAbsentDays = hoursPerDay > 0 ? (totalEffectiveAbsentHours / hoursPerDay) : 0;
  const attendancePct = totalScheduled > 0 ? ((totalAttended / totalScheduled) * 100).toFixed(1) : "100";

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Welcome Section */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full border-2 border-aerojet-sky shadow-md overflow-hidden shrink-0">
                  <ProtectedImage 
                      src={student?.photoUrl}
                      alt="ID" 
                      fallbackInitial={session.user.name?.[0]} 
                  />
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
        
        <div className="w-full md:w-auto bg-blue-50 px-5 py-3 rounded-lg border border-blue-100 text-left md:text-right">
          <p className="text-xs text-aerojet-blue uppercase font-bold tracking-wider mb-1">Current Intake</p>
          <p className="text-lg font-bold text-aerojet-sky">{student?.cohort || "Sept 2026 (TBC)"}</p>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-tight">Attendance</h3>
                <span className="text-xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-aerojet-blue">{attendancePct}%</p>
            <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                <span>Late: <b className="text-red-500">{lateHours.toFixed(1)}h</b></span>
                <span>Absence: <b className="text-red-500">{derivedAbsentDays.toFixed(1)}d</b></span>
            </div>
        </div>

        {/* Finance Card */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${outstandingBalance > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-tight">Outstanding</h3>
            <span className="text-xl">💳</span>
          </div>
          <p className="text-2xl font-bold text-aerojet-blue">GHS {(outstandingBalance * 17.5).toFixed(0)}*</p>
          <Link href="/portal/finance" className="text-xs text-aerojet-sky hover:underline mt-2 inline-block">
            View Ledger (EUR/GHS) &rarr;
          </Link>
        </div>

        {/* Status Card (Updated Title) */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${appStatus === 'APPROVED' ? 'border-l-green-500' : 'border-l-yellow-400'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-tight">Recent Application</h3>
            <span className="text-xl">📝</span>
          </div>
          <p className="text-lg font-bold text-aerojet-blue capitalize">{appStatus === 'PENDING' ? 'Under Review' : appStatus}</p>
          <p className="text-[10px] text-gray-400 mt-1">{latestApp?.course.code || 'No recent apps'}</p>
        </div>

        {/* Multi-Exam Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-aerojet-blue">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-tight">Next Exams</h3>
            <span className="text-xl">📅</span>
          </div>
          <div className="space-y-2">
            {student?.examBookings.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No exams booked</p>
            ) : (
                student?.examBookings.map(b => (
                    <div key={b.id} className="text-xs">
                        <p className="font-bold text-aerojet-blue">{b.run.course.code}</p>
                        <p className="text-gray-500">{new Date(b.run.startDatetime).toLocaleDateString()}</p>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Course Materials Section (NEW) */}
      {approvedMaterials.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-gray-100">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">My Learning Materials</h3>
            </div>
            <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvedMaterials.map(course => (
                    <div key={course.id} className="p-4 rounded-lg border border-blue-50 bg-blue-50/30 flex justify-between items-center group">
                        <div>
                            <p className="font-bold text-aerojet-blue">{course.code}</p>
                            <p className="text-[10px] text-gray-500">{course.title}</p>
                        </div>
                        <a 
                            href={course.materialLink!} 
                            target="_blank" 
                            className="bg-white text-aerojet-sky p-2 rounded-md shadow-sm border border-blue-100 hover:bg-aerojet-sky hover:text-white transition-all"
                            title="Open OneDrive"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 4. Action Required */}
      {!isProfileComplete && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden border-l-4 border-l-red-600">
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0 animate-bounce">!</div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Incomplete Profile</h4>
                <p className="text-gray-600 text-sm">Please update your address and emergency contact to finalize your applications.</p>
              </div>
            </div>
            <Link href="/portal/profile" className="w-full md:w-auto text-center bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-md">
              Update Profile &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
