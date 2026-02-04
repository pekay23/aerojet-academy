import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import ProtectedImage from "@/components/portal/ProtectedImage"; 

const prisma = new PrismaClient();

const EASA_MODULES = [
  "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", 
  "M09", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17"
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) redirect('/portal/login');
  if (session.user.role !== 'STUDENT') redirect('/staff/dashboard');

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      fees: true,
      applications: { include: { course: true }, orderBy: { appliedAt: 'desc' } },
      attendance: true,
      assessments: true,
      examBookings: {
        include: { run: { include: { course: true } } },
        where: { run: { startDatetime: { gt: new Date() } } },
        orderBy: { run: { startDatetime: 'asc' } },
        take: 3 
      },
    }
  });

  // --- LOGIC ---
  const passedModules = new Set(
    student?.assessments
      .filter(a => a.isPassed && a.type === "EASA_FINAL")
      .map(a => a.moduleCode)
  );

  const totalModules = 17;
  const progressPct = ((passedModules.size / totalModules) * 100).toFixed(0);
  const studentId = student?.studentId || "PENDING";
  
  const outstandingBalance = student?.fees
    .filter(f => f.status !== 'PAID' && f.status !== 'CLEARED')
    .reduce((acc, curr) => acc + curr.amount, 0) || 0;

  // FIX: Properly define appStatus
  const latestApp = student?.applications[0];
  const appStatus = latestApp?.status || "NOT STARTED";

  const isProfileComplete = !!(student?.phone && student?.address && student?.emergencyName);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Welcome Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full border-2 border-aerojet-sky shadow-md overflow-hidden shrink-0">
                <ProtectedImage src={student?.photoUrl} alt="ID" fallbackInitial={session.user.name?.[0]} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-aerojet-blue tracking-tight">Welcome, {session.user.name?.split(' ')[0]}!</h1>
                <p className="text-slate-500 font-mono text-sm">ID: <span className="text-aerojet-sky font-bold">{studentId}</span></p>
            </div>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-center md:text-right">
          <p className="text-[10px] text-aerojet-blue uppercase font-black tracking-widest mb-1">Current Intake</p>
          <p className="text-lg font-black text-aerojet-sky">{student?.cohort || "SEPT 2026"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            {/* Progress Tracker */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">Certification Progress</h3>
                        <p className="text-4xl font-black text-aerojet-blue">{passedModules.size} <span className="text-lg text-slate-300">/ 17 Modules</span></p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-aerojet-sky">{progressPct}%</span>
                    </div>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-10">
                    <div className="h-full bg-aerojet-sky transition-all duration-1000" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
                    {EASA_MODULES.map(mod => (
                        <div key={mod} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black ${passedModules.has(mod) ? "bg-green-500 text-white shadow-md shadow-green-100" : "bg-slate-50 text-slate-300 border border-slate-100"}`}>
                            {mod.replace('M0', 'M').replace('M', '')}
                        </div>
                    ))}
                </div>
            </div>

            {/* Exam Sittings */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">Upcoming Exam Sittings</h3>
                <div className="space-y-4">
                    {student?.examBookings.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No exams currently booked.</p>
                    ) : (
                        student?.examBookings.map(b => (
                            <div key={b.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="font-black text-aerojet-blue text-sm uppercase">{b.run.course.code}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{b.run.course.title}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-700">{new Date(b.run.startDatetime).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-aerojet-sky font-bold uppercase">Seat: {b.seatLabel || "TBA"}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-8">
            {/* Finance Card */}
            <div className={`p-8 rounded-[2.5rem] shadow-lg border-t-8 ${outstandingBalance > 0 ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-4">Financial Overview</h3>
                <p className="text-3xl font-black ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}">
                    €{outstandingBalance.toFixed(2)}
                </p>
                <Link href="/portal/finance" className="mt-6 block text-center bg-white border border-slate-200 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                    View Ledger
                </Link>
            </div>

            {/* Application Status Card - RE-ADDED LOGIC */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-black text-aerojet-sky uppercase text-[10px] tracking-widest mb-4">Application Status</h3>
                    <p className="text-2xl font-black uppercase tracking-tight">{appStatus}</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {appStatus === 'PENDING' ? 'Your application is currently under review.' : 'Your record is active.'}
                    </p>
                </div>
            </div>

            {/* Action Required */}
            {!isProfileComplete && (
                <div className="bg-white rounded-2xl shadow-lg border-l-8 border-l-red-600 p-6 animate-pulse">
                    <h4 className="font-black text-slate-900 uppercase text-xs mb-2">Profile Incomplete</h4>
                    <Link href="/portal/profile" className="text-red-600 font-bold text-xs hover:underline">Complete Now &rarr;</Link>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
