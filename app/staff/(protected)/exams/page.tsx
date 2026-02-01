"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // Use router for SPA navigation

export default function StaffExamsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Form State
  const [newRun, setNewRun] = useState({ moduleId: '', roomId: '', datetime: '', duration: '60' });
  const [isCreating, setIsCreating] = useState(false);

  async function fetchData() {
    try {
        const res = await fetch('/api/staff/exams');
        const data = await res.json();
        setRuns(data.runs || []);
        setRooms(data.rooms || []);
        setModules(data.modules || []);
    } catch (e) {
        toast.error("Failed to load data");
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
        const res = await fetch('/api/staff/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRun)
        });
        if (res.ok) {
            toast.success("Exam Scheduled Successfully");
            setNewRun({ moduleId: '', roomId: '', datetime: '', duration: '60' }); // Reset
            fetchData();
        } else {
            toast.error("Failed to schedule exam");
        }
    } catch (e) {
        toast.error("Error occurred");
    } finally {
        setIsCreating(false);
    }
  };

  if (loading) return <div className="p-8">Loading Exams...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>

      {/* --- Create Exam Form --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Schedule New Exam Run</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-5 gap-4 items-end">
            <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">Module</label>
                <select 
                    value={newRun.moduleId} onChange={e => setNewRun({...newRun, moduleId: e.target.value})}
                    className="w-full border rounded p-2 text-sm" required
                >
                    <option value="">Select Module...</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.title}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Room</label>
                <select 
                    value={newRun.roomId} onChange={e => setNewRun({...newRun, roomId: e.target.value})}
                    className="w-full border rounded p-2 text-sm" required
                >
                    <option value="">Select Room...</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Date & Time</label>
                <input 
                    type="datetime-local" 
                    value={newRun.datetime} onChange={e => setNewRun({...newRun, datetime: e.target.value})}
                    className="w-full border rounded p-2 text-sm" required
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Duration (Min)</label>
                <input 
                    type="number" 
                    value={newRun.duration} onChange={e => setNewRun({...newRun, duration: e.target.value})}
                    className="w-full border rounded p-2 text-sm" required min="30"
                />
            </div>
            <button disabled={isCreating} className="bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm">
                {isCreating ? 'Creating...' : 'Schedule Exam'}
            </button>
        </form>
      </div>

      {/* --- Exam List --- */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-200">
                <thead className="bg-slate-50 text-slate-800 font-bold border-b">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Module</th>
                        <th className="p-4">Room</th>
                        <th className="p-4">Capacity</th>
                        <th className="p-4">Bookings</th>
                        <th className="p-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {runs.map(run => (
                        <tr 
                            key={run.id} 
                            className="hover:bg-slate-50 cursor-pointer transition-colors" 
                            onClick={() => router.push(`/staff/exams/${run.id}`)} // Use router.push for faster navigation
                        >
                            <td className="p-4 font-mono">{new Date(run.startDatetime).toLocaleString()}</td>
                            <td className="p-4 font-bold">{run.course.code}</td>
                            <td className="p-4">{run.room.name}</td>
                            <td className="p-4">{run.maxCapacity}</td>
                            <td className="p-4 font-bold text-blue-600">{run.bookings.length} Students</td>
                            <td className="p-4 text-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{run.status}</span>
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
