"use client";
import Link from "next/link";

export default function InstructorDashboard({ session }: { session: any }) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-aerojet-blue">Instructor Console</h1>
        <p className="text-slate-500 mt-2">Welcome back, {session.user.name}. Manage your classes and attendance here.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/staff/materials" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-aerojet-sky transition group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:bg-blue-600 group-hover:text-white transition">📚</div>
            <h3 className="font-bold text-slate-800 text-lg">My Courses</h3>
            <p className="text-sm text-gray-500 mt-2">View assigned modules and materials.</p>
        </Link>

        <Link href="/staff/attendance" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-aerojet-sky transition group">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:bg-purple-600 group-hover:text-white transition">📝</div>
            <h3 className="font-bold text-slate-800 text-lg">Mark Attendance</h3>
            <p className="text-sm text-gray-500 mt-2">Daily register for your active classes.</p>
        </Link>

        <Link href="/staff/results" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-aerojet-sky transition group">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:bg-green-600 group-hover:text-white transition">📊</div>
            <h3 className="font-bold text-slate-800 text-lg">Publish Results</h3>
            <p className="text-sm text-gray-500 mt-2">Input exam scores for your students.</p>
        </Link>
      </div>
    </div>
  );
}
