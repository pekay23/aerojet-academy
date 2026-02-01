"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/attendance')
      .then(res => res.json())
      .then(data => { setRecords(data.records || []); setLoading(false); })
      .catch(() => toast.error("Failed to load"));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Attendance...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-aerojet-blue mb-6">Attendance History</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-150">
                <thead className="bg-slate-50 border-b font-bold text-slate-800">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Hours Scheduled</th>
                        <th className="px-6 py-4">Hours Attended</th>
                        <th className="px-6 py-4">Lateness</th>
                        <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {records.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center italic">No records found.</td></tr>
                    ) : (
                        records.map(rec => {
                            const isPresent = rec.attendedHours === rec.scheduledHours;
                            const isAbsent = rec.attendedHours === 0;
                            return (
                                <tr key={rec.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">{new Date(rec.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{rec.course.code}</td>
                                    <td className="px-6 py-4">{rec.scheduledHours}</td>
                                    <td className="px-6 py-4">{rec.attendedHours}</td>
                                    <td className="px-6 py-4">{rec.lateMinutes > 0 ? <span className="text-red-600 font-bold">{rec.lateMinutes}m</span> : "-"}</td>
                                    <td className="px-6 py-4 text-center">
                                        {isAbsent ? <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">ABSENT</span> : 
                                         isPresent ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">PRESENT</span> :
                                         <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">PARTIAL</span>}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
