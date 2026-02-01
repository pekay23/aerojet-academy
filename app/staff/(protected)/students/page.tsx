"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function StudentsListPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: 'Password123!' });

  async function fetchStudents() {
    const res = await fetch('/api/staff/students');
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }

  useEffect(() => { fetchStudents(); }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/staff/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
    });
    if (res.ok) {
        toast.success("Student Created Successfully");
        setIsAddModalOpen(false);
        fetchStudents();
    } else {
        toast.error("Failed to create student. Email may be taken.");
    }
  };

  if (loading) return <div className="p-8">Loading Students...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition"
        >
            + Register New Student
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-200">
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
                    <td className="p-4 font-mono text-blue-600 font-bold">{student.studentId || "PENDING"}</td>
                    <td className="p-4 text-right">
                        <Link href={`/staff/students/${student.id}`} className="text-blue-600 hover:underline font-bold text-xs uppercase">
                            View Profile
                        </Link>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Manual Onboarding</h2>
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Full Name</label>
                        <input type="text" required className="w-full border rounded p-2" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Email</label>
                        <input type="email" required className="w-full border rounded p-2" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Temporary Password</label>
                        <input type="text" required className="w-full border rounded p-2" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Create Account</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
