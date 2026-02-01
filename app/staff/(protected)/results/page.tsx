"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ResultsEntryPage() {
  const [examRuns, setExamRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({}); // studentId -> score

  // 1. Load Exam Runs
  useEffect(() => {
    fetch('/api/staff/exams').then(res => res.json()).then(data => setExamRuns(data.runs || []));
  }, []);

  // 2. Load Roster when Run Selected
  useEffect(() => {
    if (!selectedRun) return;
    fetch(`/api/staff/exams/${selectedRun}`).then(res => res.json()).then(data => {
        setStudents(data.run.bookings.map((b: any) => b.student));
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

    if (res.ok) toast.success("Grades Published");
    else toast.error("Failed to publish");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Publish Exam Results</h1>

      {/* Selector */}
      <div className="bg-white p-6 rounded shadow-sm border">
        <label className="block font-bold text-sm mb-2">Select Exam Session</label>
        <select className="w-full border rounded p-2" onChange={e => setSelectedRun(e.target.value)}>
            <option value="">-- Choose Exam --</option>
            {examRuns.map(run => (
                <option key={run.id} value={run.id}>
                    {new Date(run.startDatetime).toLocaleDateString()} - {run.course.code} ({run.bookings.length} Students)
                </option>
            ))}
        </select>
      </div>

      {/* Grade Entry Table */}
      {selectedRun && (
        <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 font-bold border-b">
                    <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">ID</th>
                        <th className="p-4">Score (%)</th>
                        <th className="p-4">Result</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => {
                        const score = parseFloat(grades[s.id] || "0");
                        const passed = score >= 75;
                        return (
                            <tr key={s.id} className="border-b">
                                <td className="p-4">{s.user.name}</td>
                                <td className="p-4 font-mono">{s.studentId}</td>
                                <td className="p-4">
                                    <input 
                                        type="number" 
                                        className="border rounded w-20 p-1 font-bold text-lg"
                                        min="0" max="100"
                                        onChange={e => setGrades({...grades, [s.id]: e.target.value})}
                                    />
                                </td>
                                <td className="p-4 font-bold">
                                    {grades[s.id] ? (passed ? <span className="text-green-600">PASS</span> : <span className="text-red-600">FAIL</span>) : "-"}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="p-4 bg-gray-50 text-right">
                <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">
                    Publish Results
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
