"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Papa from 'papaparse'; // Ensure you ran npm install papaparse

export default function StudentsListPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: 'Password123!' });

  async function fetchStudents() {
    try {
      const res = await fetch('/api/staff/students');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (e) {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStudents(); }, []);

  // --- 1. HANDLE MANUAL ADD ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/staff/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
    });
    if (res.ok) {
        toast.success("Student account created successfully");
        setIsAddModalOpen(false);
        setNewStudent({ name: '', email: '', password: 'Password123!' });
        fetchStudents();
    } else {
        toast.error("Failed to create student. Email may already be in use.");
    }
  };

  // --- 2. HANDLE BULK IMPORT (DreamClass CSV) ---
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            try {
                const res = await fetch('/api/staff/students/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ students: results.data })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    toast.success(`Import complete! Created ${data.count} new records.`);
                    fetchStudents();
                } else {
                    toast.error("Bulk import failed. Check file formatting.");
                }
            } catch (err) {
                toast.error("Connection error during import.");
            } finally {
                setIsImporting(false);
                e.target.value = ""; // Reset input
            }
        }
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse uppercase font-black text-xs tracking-widest">Accessing Directory...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Student Directory</h1>
            <p className="text-slate-500">Manage all registered trainees and applicants.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            {/* Hidden Input for CSV */}
            <input type="file" accept=".csv" onChange={handleFileImport} className="hidden" id="csv-upload" disabled={isImporting} />
            <label 
                htmlFor="csv-upload" 
                className={`cursor-pointer bg-white border-2 border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-aerojet-sky transition-all shadow-sm flex items-center gap-2 ${isImporting ? 'opacity-50' : ''}`}
            >
                {isImporting ? 'Processing...' : '⇅ Import CSV'}
            </label>

            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-aerojet-sky text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-aerojet-blue transition-all shadow-lg shadow-blue-200"
            >
                + Manual Registration
            </button>
        </div>
      </div>
      
      {/* Table Section with Horizontal Scroll */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-225">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-slate-100">
                <tr>
                <th className="p-5">Student Name</th>
                <th className="p-5">Email Address</th>
                <th className="p-5">Phone Number</th>
                <th className="p-5">Official ID</th>
                <th className="p-5 text-right">Profile</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {students.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center italic text-slate-400">No students found in the database.</td></tr>
                ) : (
                    students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-[10px] uppercase">
                                    {student.user.name?.[0]}
                                </div>
                                <span className="font-bold text-slate-800">{student.user.name}</span>
                            </div>
                        </td>
                        <td className="p-5 font-medium">{student.user.email}</td>
                        <td className="p-5 text-slate-500">{student.phone || "—"}</td>
                        <td className="p-5">
                            <span className={`font-mono font-bold px-2 py-1 rounded text-xs ${student.studentId ? 'text-blue-600 bg-blue-50' : 'text-slate-300'}`}>
                                {student.studentId || "PENDING"}
                            </span>
                        </td>
                        <td className="p-5 text-right">
                            <Link 
                                href={`/staff/students/${student.id}`} 
                                className="inline-block bg-white border border-slate-200 text-slate-400 group-hover:text-aerojet-sky group-hover:border-aerojet-sky px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                View 
                            </Link>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* MANUAL ONBOARDING MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Register Student</h2>
                <p className="text-sm text-slate-500 mb-8">This will create a student user account and activate it immediately.</p>
                
                <form onSubmit={handleAddStudent} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Full Name</label>
                        <input type="text" required className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:border-aerojet-sky outline-none transition-all" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} placeholder="e.g. Samuel Amissah" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Email Address</label>
                        <input type="email" required className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:border-aerojet-sky outline-none transition-all" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} placeholder="student@example.com" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Set Password</label>
                        <input type="text" required className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:border-aerojet-sky outline-none transition-all" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Cancel</button>
                        <button type="submit" className="flex-2 bg-aerojet-sky text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-aerojet-blue transition-all">Create Account</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
