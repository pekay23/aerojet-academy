"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ClassRosterPage() {
  const params = useParams();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/staff/my-teaching/${params.courseId}`)
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || []);
        setLoading(false);
      });
  }, [params.courseId]);

  if (loading) return <div className="p-8">Loading Roster...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            {/* Improved Back Button */}
            <Link href="/staff/materials" className="inline-flex items-center text-slate-500 hover:text-slate-800 text-sm font-bold mb-2 transition-colors bg-white px-3 py-1 rounded border shadow-sm">
                ← Back to Courses
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Class Roster</h1>
            <p className="text-slate-500">{students.length} Enrolled Students</p>
        </div>
        
        {/* Placeholder for Attendance Action - could link to the main attendance tool */}
        <Link href="/staff/attendance" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 shadow-md">
            Mark Attendance
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
        {/* Horizontal Scroll Fix */}
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-150">
            <thead className="bg-slate-50 font-bold border-b">
                <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-center">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {students.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No students found.</td></tr>
                ) : (
                    students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-700">{s.user.name}</td>
                            <td className="p-4 font-mono text-blue-600">{s.studentId || "PENDING"}</td>
                            <td className="p-4">{s.user.email}</td>
                            <td className="p-4 text-center">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">ACTIVE</span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
        </div>
        </div>
    </div>
  );
}
