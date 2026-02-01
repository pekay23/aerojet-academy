"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ResultsEntryPage() {
  const [examRuns, setExamRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({}); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/staff/exams').then(res => res.json()).then(data => {
        setExamRuns(data.runs || []);
        setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedRun) return;
    fetch(`/api/staff/exams/${selectedRun}`).then(res => res.json()).then(data => {
        setStudents(data.run.bookings.map((b: any) => b.student));
        // You would ideally fetch existing grades here to pre-fill
    });
  }, [selectedRun]);

  const handleSubmit = async () => {
    const payload = students.map(s => ({
        studentId: s.id,
        score: grades[s.id] || "0"
    }));

    const res = await fetch('/api/staff/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examRunId: selectedRun, results: payload })
    });

    if (res.ok) toast.success("Grades Published / Updated");
    else toast.error("Failed to publish");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Results Publishing</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Exam Session</label>
        <select className="w-full border rounded-lg p-3 text-sm" onChange={e => setSelectedRun(e.target.value)}>
            <option value="">-- Choose Exam --</option>
            {examRuns.map(run => (
                <option key={run.id} value={run.id}>
                    {new Date(run.startDatetime).toLocaleDateString()} — {run.course.code} ({run.bookings.length} Students)
                </option>
            ))}
        </select>
      </div>

      {selectedRun && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm min-w-150">
                    <thead className="bg-slate-50 font-bold border-b text-slate-700">
                        <tr>
                            <th className="p-4">Student Name</th>
                            <th className="p-4">ID Number</th>
                            <th className="p-4">Score (0-100)</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map(s => {
                            const score = parseFloat(grades[s.id] || "0");
                            const passed = score >= 75;
                            return (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-medium">{s.user.name}</td>
                                    <td className="p-4 font-mono text-slate-500">{s.studentId || "PENDING"}</td>
                                    <td className="p-4">
                                        <input 
                                            type="number" 
                                            className="border border-gray-300 rounded-md w-24 p-2 font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            min="0" max="100"
                                            placeholder="-"
                                            onChange={e => setGrades({...grades, [s.id]: e.target.value})}
                                        />
                                    </td>
                                    <td className="p-4">
                                        {grades[s.id] ? (
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {passed ? 'PASS' : 'FAIL'}
                                            </span>
                                        ) : <span className="text-gray-300 text-xs">Pending Input</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button onClick={handleSubmit} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all">
                    Publish / Update Results
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
