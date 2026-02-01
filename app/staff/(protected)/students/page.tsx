"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function StudentsListPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      const res = await fetch('/api/staff/students');
      const data = await res.json();
      setStudents(data.students || []);
      setLoading(false);
    }
    fetchStudents();
  }, []);

  if (loading) return <div className="p-8">Loading Students...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Student Directory</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 text-slate-800 font-bold border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Student ID</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{student.user.name}</td>
                <td className="p-4">{student.user.email}</td>
                <td className="p-4">{student.phone || "-"}</td>
                <td className="p-4 font-mono text-blue-600">{student.studentId || "PENDING"}</td>
                <td className="p-4 text-right">
                    <Link href={`/staff/students/${student.id}`} className="text-blue-600 hover:underline font-bold text-xs">
                        View Details
                    </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
