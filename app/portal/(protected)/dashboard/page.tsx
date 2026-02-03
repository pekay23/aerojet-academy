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
        take: 3 
      },
      applications: {
        include: { course: true },
        orderBy: { appliedAt: 'desc' }
      },
      attendance: true 
    }
  });

  const isProfileComplete = !!(student?.phone && student?.address && student?.emergencyName);
  const studentId = student?.studentId || "PENDING";
  
  const outstandingBalance = student?.fees
    .filter(f => f.status !== 'PAID' && f.status !== 'CLEARED')
    .reduce((acc, curr) => acc + curr.amount, 0) || 0;

  const latestApp = student?.applications[0];
  const appStatus = latestApp?.status || "Not Started";

  // Course Materials Access
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
  const derivedAbsentDays = hoursPerDay > 0 ? ((rawAbsentHours + lateHours) / hoursPerDay) : 0;
  const attendancePct = totalScheduled > 0 ? ((totalAttended / totalScheduled) * 100).toFixed(1) : "100";

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Welcome Section */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full border-2 border-aerojet-sky shadow-md overflow-hidden shrink-0">
                <ProtectedImage 
                    src={student?.photoUrl || ""} 
                    alt="Official ID Photo" 
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

      {/* 2. Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
            <h3 className="font-bold text-gray-700 text-[10px] uppercase tracking-widest mb-4">Current Attendance</h3>
            <p className="text-3xl font-black text-aerojet-blue">{attendancePct}%</p>
            <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                <span>Lateness: <b className="text-red-500">{lateHours.toFixed(1)}h</b></span>
                <span>Absence: <b className="text-red-500">{derivedAbsentDays.toFixed(1)}d</b></span>
            </div>
        </div>

        {/* Finance */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${outstandingBalance > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <h3 className="font-bold text-gray-700 text-[10px] uppercase tracking-widest mb-4">Outstanding Bal.</h3>
          <p className="text-2xl font-black text-aerojet-blue">€{outstandingBalance.toFixed(2)}</p>
          <Link href="/portal/finance" className="text-[10px] font-bold text-aerojet-sky hover:underline mt-2 inline-block uppercase">View Ledger &rarr;</Link>
        </div>

        {/* Status (NEW TITLE) */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${appStatus === 'APPROVED' ? 'border-l-green-500' : 'border-l-orange-400'}`}>
          <h3 className="font-bold text-gray-700 text-[10px] uppercase tracking-widest mb-4">Recent Application Status</h3>
          <p className="text-lg font-black text-aerojet-blue capitalize tracking-tight">{appStatus === 'PENDING' ? 'Under Review' : appStatus}</p>
          <p className="text-[10px] text-gray-400 mt-1 truncate">{latestApp?.course.code || 'No active app'}</p>
        </div>

        {/* Exams (MULTI-LIST) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-aerojet-blue overflow-hidden">
          <h3 className="font-bold text-gray-700 text-[10px] uppercase tracking-widest mb-4">Next Exams</h3>
          <div className="space-y-2 max-h-20 overflow-y-auto no-scrollbar">
            {student?.examBookings.length === 0 ? <p className="text-[10px] text-gray-400 italic">None booked</p> : student?.examBookings.map(b => (
                <div key={b.id} className="flex justify-between items-center text-[10px] border-b border-slate-50 pb-1 last:border-0">
                    <b className="text-aerojet-blue uppercase">{b.run.course.code}</b>
                    <span className="text-slate-400 font-mono">{new Date(b.run.startDatetime).toLocaleDateString()}</span>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Course Materials Section */}
      {approvedMaterials.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-gray-100">
                <h3 className="font-black text-slate-700 text-[10px] uppercase tracking-[0.2em]">Learning Materials Access</h3>
            </div>
            <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvedMaterials.map(course => (
                    <div key={course.id} className="p-4 rounded-xl border border-blue-50 bg-blue-50/20 flex justify-between items-center group hover:bg-blue-50 transition-colors">
                        <div className="overflow-hidden">
                            <p className="font-black text-aerojet-blue text-sm">{course.code}</p>
                            <p className="text-[10px] text-gray-500 truncate w-full">{course.title}</p>
                        </div>
                        <a href={course.materialLink!} target="_blank" className="bg-white text-aerojet-sky p-2 rounded-lg shadow-sm border border-blue-100 hover:bg-aerojet-sky hover:text-white transition-all ml-4 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 4. Action Required */}
      {!isProfileComplete && (
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden border-l-8 border-l-red-600">
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 font-black text-xl shrink-0 animate-pulse">!</div>
              <div>
                <h4 className="font-black text-slate-900 uppercase tracking-tight">Profile Incomplete</h4>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">We require your residential address and emergency contact details before we can finalize your enrollment. Please update your profile immediately.</p>
              </div>
            </div>
            <Link href="/portal/profile" className="w-full md:w-auto text-center bg-red-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-red-700 transition active:scale-95">
              Update Profile &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
