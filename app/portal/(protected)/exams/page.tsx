"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type ExamRun = {
  id: string;
  course: { title: string; code: string };
  startDatetime: string;
  maxCapacity: number;
  bookings: any[];
};

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  async function fetchExams() {
    try {
      const res = await fetch('/api/portal/exams');
      const data = await res.json();
      setExams(data.examRuns || []);
    } catch (error) {
      toast.error("Failed to load exams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExams();
  }, []);

  const handleBook = async (runId: string) => {
    setBookingId(runId);
    try {
      const res = await fetch('/api/portal/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
      
      if (res.ok) {
        toast.success("Exam seat booked successfully!");
        fetchExams();
      } else {
        const err = await res.json();
        toast.error(err.error || "Booking failed.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setBookingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Exam Schedule...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-aerojet-blue">Exam Booking</h1>
        <p className="text-gray-600 mt-1">Book your seat for upcoming EASA module exams.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4">Module</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Availability</th>
                    <th className="px-6 py-4 text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {exams.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No upcoming exams scheduled.</td>
                    </tr>
                ) : (
                    exams.map((exam) => {
                        const seatsLeft = exam.maxCapacity - exam.bookings.length;
                        return (
                            <tr key={exam.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-aerojet-blue">{exam.course.code}</p>
                                    <p className="text-xs text-gray-500">{exam.course.title}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-800">{new Date(exam.startDatetime).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-500">{new Date(exam.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${seatsLeft > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {seatsLeft} Seats Left
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleBook(exam.id)}
                                        disabled={seatsLeft === 0 || !!bookingId}
                                        className="bg-aerojet-sky text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-aerojet-soft-blue transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {seatsLeft === 0 ? 'Full' : (bookingId === exam.id ? 'Booking...' : 'Book Seat')}
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
