"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Papa from 'papaparse';

export default function StudentsListPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchStudents() {
    const res = await fetch('/api/staff/students');
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }

  useEffect(() => { fetchStudents(); }, []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Parse CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const loadingToast = toast.loading("Processing bulk import...");
        
        try {
          const res = await fetch('/api/staff/students/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students: results.data })
          });

          if (res.ok) {
            const data = await res.json();
            toast.success(`Success! Imported ${data.count} students.`, { id: loadingToast });
            fetchStudents();
          } else {
            toast.error("Import failed. Check column names.", { id: loadingToast });
          }
        } catch (error) {
          toast.error("Network error during import.", { id: loadingToast });
        }
      }
    });
  };

  if (loading) return <div className="p-8">Loading Directory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
        
        <div className="flex gap-3">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".csv" 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 transition shadow-sm"
          >
            ⇅ Import DreamClass CSV
          </button>

          <Link href="/staff/students/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-md">
            + Add Individual
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
    </div>
  );
}
