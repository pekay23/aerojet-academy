"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react"; // Import session
import InstructorDashboard from "@/components/staff/InstructorDashboard"; // Import component

export default function StaffDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If Instructor, show specific dashboard
  if (session && (session.user as any).role === 'INSTRUCTOR') {
      return <InstructorDashboard session={session} />;
  }

  useEffect(() => {
    // Only fetch admin stats if NOT instructor
    if (session && (session.user as any).role !== 'INSTRUCTOR') {
        fetch('/api/staff/dashboard')
        .then(res => res.json())
        .then(data => { setData(data); setLoading(false); });
    }
  }, [session]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading Command Center...</div>;

  const { stats, activity } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Command Center</h1>
          <p className="text-slate-500 mt-1">Overview of academy operations.</p>
        </div>
        <div className="text-sm font-mono text-slate-400">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* --- STATS GRID (Glassy Cards) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Pending Applications */}
        <div className={`relative p-6 rounded-2xl shadow-sm border border-white/20 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 ${stats.pendingApps > 0 ? 'bg-orange-50/80' : 'bg-white/60'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Apps</p>
              <h3 className="text-4xl font-bold text-slate-800 mt-2">{stats.pendingApps}</h3>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">📝</div>
          </div>
          {stats.pendingApps > 0 && (
            <Link href="/staff/applications" className="absolute bottom-4 right-6 text-xs font-bold text-orange-600 hover:underline">
              Review &rarr;
            </Link>
          )}
        </div>

        {/* Payments to Verify */}
        <div className={`relative p-6 rounded-2xl shadow-sm border border-white/20 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 ${stats.verifyingPayments > 0 ? 'bg-blue-50/80' : 'bg-white/60'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verify Payments</p>
              <h3 className="text-4xl font-bold text-slate-800 mt-2">{stats.verifyingPayments}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">💳</div>
          </div>
          {stats.verifyingPayments > 0 && (
            <Link href="/staff/finance" className="absolute bottom-4 right-6 text-xs font-bold text-blue-600 hover:underline">
              Verify &rarr;
            </Link>
          )}
        </div>

        {/* Active Students */}
        <div className="relative p-6 rounded-2xl shadow-sm border border-white/20 backdrop-blur-xl bg-white/60">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
              <h3 className="text-4xl font-bold text-slate-800 mt-2">{stats.totalStudents}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg text-green-600">🎓</div>
          </div>
        </div>

        {/* Scheduled Exams */}
        <div className="relative p-6 rounded-2xl shadow-sm border border-white/20 backdrop-blur-xl bg-white/60">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Exams</p>
              <h3 className="text-4xl font-bold text-slate-800 mt-2">{stats.upcomingExams}</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">📅</div>
          </div>
        </div>
      </div>

      {/* --- RECENT ACTIVITY --- */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Recent Applications */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
            Recent Applications
          </h3>
          <div className="space-y-4">
            {activity.recentApps.length === 0 ? <p className="text-sm text-gray-400">No recent applications.</p> : activity.recentApps.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between text-sm p-3 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                    {app.student.user.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{app.student.user.name}</p>
                    <p className="text-xs text-gray-500">{app.course.code}</p>
                  </div>
                </div>
                <Link href="/staff/applications" className="text-xs font-bold text-blue-600 hover:underline">Review</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Payments to Review */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
            Payments to Review
          </h3>
          <div className="space-y-4">
            {activity.recentPayments.length === 0 ? <p className="text-sm text-gray-400">No pending payments.</p> : activity.recentPayments.map((pay: any) => (
              <div key={pay.id} className="flex items-center justify-between text-sm p-3 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">
                    $
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{pay.student.user.name}</p>
                    <p className="text-xs text-gray-500">GHS {pay.amount.toFixed(2)}</p>
                  </div>
                </div>
                <Link href="/staff/finance" className="text-xs font-bold text-blue-600 hover:underline">Verify</Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
