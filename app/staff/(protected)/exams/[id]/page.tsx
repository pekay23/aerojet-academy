"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import ConfirmationModal from "@/components/modal/ConfirmationModal";
import InputModal from "@/components/modal/InputModal";

export default function ExamRosterPage() {
  const params = useParams();
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [assignData, setAssignData] = useState<{ id: string, currentSeat: string | null } | null>(null);

  async function fetchRun() {
    const res = await fetch(`/api/staff/exams/${params.id}`);
    const data = await res.json();
    setRun(data.run);
    setLoading(false);
  }

  useEffect(() => { fetchRun(); }, []);

  const handleRemoveConfirm = async () => {
    if (!removeId) return;
    
    const res = await fetch(`/api/staff/exams/${params.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: removeId })
    });

    if (res.ok) {
      toast.success("Student removed from exam.");
      fetchRun();
    } else {
      toast.error("Failed to remove.");
    }
    setRemoveId(null);
  };

  const handleAssignConfirm = async (seatLabel: string) => {
    if (!assignData) return;

    const res = await fetch(`/api/staff/exams/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: assignData.id, seatLabel })
    });

    if (res.ok) {
        toast.success(`Seat ${seatLabel} assigned.`);
        fetchRun();
    } else {
        toast.error("Failed. Seat might be taken.");
    }
    setAssignData(null);
  };

  if (loading) return <div className="p-8">Loading Roster...</div>;
  if (!run) return <div className="p-8">Exam not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <Link href="/staff/exams" className="text-sm text-blue-600 hover:underline mb-2 block">← Back to Exams</Link>
            <h1 className="text-2xl font-bold text-slate-800">{run.course.code}: {run.course.title}</h1>
            <p className="text-slate-500">
                {new Date(run.startDatetime).toLocaleString()} • {run.room.name} • {run.bookings.length} / {run.maxCapacity} Seats
            </p>
        </div>
        <div className="flex gap-2">
            <button className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold" onClick={() => window.print()}>Print Roster</button>
        </div>
      </div>

      {/* Booking List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="bg-slate-50 px-6 py-3 font-bold text-slate-700 border-b">Registered Students</h3>
        <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b text-xs uppercase font-bold text-gray-400">
                <tr>
                    <th className="px-6 py-3">Seat</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {run.bookings.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center italic">No bookings yet.</td></tr>
                ) : (
                    run.bookings.map((booking: any) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono font-bold text-blue-600 text-lg">
                                {booking.seatLabel || <span className="text-gray-300 text-sm font-normal">Unassigned</span>}
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-bold text-slate-700">{booking.student.user.name}</p>
                                <p className="text-xs text-gray-400">{booking.student.user.email}</p>
                            </td>
                            <td className="px-6 py-4 font-mono">{booking.student.studentId || "PENDING"}</td>
                            <td className="px-6 py-4">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">CONFIRMED</span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button 
                                    onClick={() => setAssignData({ id: booking.id, currentSeat: booking.seatLabel })}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded"
                                >
                                    {booking.seatLabel ? 'Edit Seat' : 'Assign Seat'}
                                </button>
                                <button 
                                    onClick={() => setRemoveId(booking.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 hover:bg-red-50 px-3 py-1 rounded"
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* --- MODALS --- */}
      <ConfirmationModal 
        isOpen={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Student"
        message="Are you sure you want to remove this student from the exam? This cannot be undone."
      />

      <InputModal 
        isOpen={!!assignData}
        onClose={() => setAssignData(null)}
        onConfirm={handleAssignConfirm}
        title="Assign Seat"
        message="Enter the seat number (e.g. S01, A-12) for this student."
        defaultValue={assignData?.currentSeat || ""}
        placeholder="Seat Number"
      />
    </div>
  );
}
