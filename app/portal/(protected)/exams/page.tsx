"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type ExamRun = {
  id: string;
  course: { title: string; code: string };
  startDatetime: string;
  maxCapacity: number;
  bookings: any[];
  room: { name: string };
};

type MyBooking = {
  id: string;
  status: string;
  seatLabel: string | null;
  run: ExamRun;
};

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamRun[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  async function fetchData() {
    try {
      // 1. Fetch available exams
      const resExams = await fetch('/api/portal/exams');
      const dataExams = await resExams.json();
      setExams(dataExams.examRuns || []);

      // 2. Fetch MY bookings
      const resMy = await fetch('/api/portal/exams/my-bookings');
      const dataMy = await resMy.json();
      setMyBookings(dataMy.bookings || []);

    } catch (error) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
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
        fetchData();
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

  // Helper to check if I already booked a run
  const isBooked = (runId: string) => myBookings.some(b => b.run.id === runId);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Exam Schedule...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      
      {/* SECTION 1: MY SCHEDULED EXAMS */}
      {myBookings.length > 0 && (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-aerojet-blue border-b border-gray-200 pb-2">My Confirmed Schedule</h2>
            <div className="grid md:grid-cols-2 gap-4">
                {myBookings.map(booking => (
                    <div key={booking.id} className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-l-green-500 border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-aerojet-blue">{booking.run.course.code}</h3>
                                <p className="text-sm text-gray-600">{booking.run.course.title}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-aerojet-blue">
                                    {booking.seatLabel || "--"}
                                </span>
                                <span className="text-xs uppercase font-bold text-gray-400">Seat No.</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <div className="flex items-center text-gray-700">
                                <span className="mr-2">📅</span>
                                {new Date(booking.run.startDatetime).toLocaleString()}
                            </div>
                            <div className="flex items-center text-gray-700">
                                <span className="mr-2">📍</span>
                                {booking.run.room.name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* SECTION 2: BOOK NEW EXAM */}
      <div>
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-aerojet-blue">Book Exams</h1>
            <p className="text-gray-600 mt-1">Reserve your seat for upcoming sessions.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm text-gray-600 min-w-150">
                    <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Module</th>
                            <th className="px-6 py-4 whitespace-nowrap">Date & Time</th>
                            <th className="px-6 py-4 whitespace-nowrap">Venue</th>
                            <th className="px-6 py-4 whitespace-nowrap">Availability</th>
                            <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {exams.map((exam) => {
                            const seatsLeft = exam.maxCapacity - exam.bookings.length;
                            const alreadyBooked = isBooked(exam.id);
                            const isClickable = !alreadyBooked && seatsLeft > 0 && !bookingId;

                            return (
                                <tr key={exam.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="font-bold text-aerojet-blue">{exam.course.code}</p>
                                        <p className="text-xs text-gray-500">{exam.course.title}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="font-medium text-gray-800">{new Date(exam.startDatetime).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-500">{new Date(exam.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {exam.room.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${seatsLeft > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {seatsLeft} Seats Left
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        {alreadyBooked ? (
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded border border-green-200">
                                                Booked
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleBook(exam.id)}
                                                disabled={!isClickable}
                                                className={`px-4 py-2 rounded-md font-bold text-xs transition ${
                                                    !isClickable
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                                    : "bg-aerojet-sky text-white hover:bg-aerojet-soft-blue"
                                                }`}
                                            >
                                                {seatsLeft === 0 ? 'Full' : (bookingId === exam.id ? 'Booking...' : 'Book Seat')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
