"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AttendancePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Form State: studentId -> { attended, late }
  const [rosterState, setRosterState] = useState<Record<string, { attended: string, late: string }>>({});
  const [scheduledHours, setScheduledHours] = useState("6"); // Default 6 hours/day

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/staff/courses');
      const data = await res.json();
      setCourses(data.courses || []);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
        setStudents([]);
        return;
    }
    async function fetchRoster() {
        const res = await fetch('/api/staff/applications'); 
        const data = await res.json();
        
        const enrolled = data.applications
            .filter((app: any) => app.courseId === selectedCourse && app.status === 'APPROVED')
            .map((app: any) => app.student);
            
        setStudents(enrolled);
        
        const initial: any = {};
        enrolled.forEach((s: any) => initial[s.id] = { attended: scheduledHours, late: "0" });
        setRosterState(initial);
    }
    fetchRoster();
  }, [selectedCourse, scheduledHours]);

  const handleSubmit = async () => {
    const records = students.map(s => ({
        studentId: s.id,
        scheduled: scheduledHours,
        attended: rosterState[s.id]?.attended || scheduledHours,
        late: rosterState[s.id]?.late || "0"
    }));

    const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, date, records })
    });

    if (res.ok) toast.success("Attendance Saved");
    else toast.error("Failed to save");
  };

  const markAllPresent = () => {
    if (students.length === 0) return;
    const newState: Record<string, { attended: string, late: string }> = {};
    students.forEach(s => {
        newState[s.id] = { attended: scheduledHours, late: "0" };
    });
    setRosterState(newState);
    toast.info("Marked all students as present.");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Daily Attendance Register</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 grid md:grid-cols-3 gap-4 items-end">
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Select Course</label>
            <select className="w-full border rounded p-2" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                <option value="">-- Choose Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
            </select>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Date</label>
    <input 
        type="date" 
        className="w-full bg-white border border-blue-200 rounded p-2 font-bold text-blue-900" 
        value={date} 
        onChange={e => setDate(e.target.value)} 
    />
</div>

        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Scheduled Hours</label>
            <input type="number" className="w-full border rounded p-2" value={scheduledHours} onChange={e => setScheduledHours(e.target.value)} />
        </div>
      </div>

      {selectedCourse && (
        <>
          <div className="flex justify-end">
              <button 
                onClick={markAllPresent} 
                className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded font-bold text-sm hover:bg-gray-200 disabled:opacity-50"
                disabled={students.length === 0}
              >
                Mark All as Present
              </button>
          </div>
          {students.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-150">
                        <thead className="bg-slate-50 border-b font-bold text-slate-700">
                            <tr>
                                <th className="p-4">Student</th>
                                <th className="p-4 w-32">Attended (Hrs)</th>
                                <th className="p-4 w-32">Late (Mins)</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {students.map(s => {
                                const state = rosterState[s.id] || { attended: scheduledHours, late: "0" };
                                const isAbsent = parseFloat(state.attended) === 0;
                                const isPartial = parseFloat(state.attended) > 0 && parseFloat(state.attended) < parseFloat(scheduledHours);
                                return (
                                    <tr key={s.id} className={isAbsent ? "bg-red-50" : ""}>
                                        <td className="p-4 font-medium">{s.user.name}</td>
                                        <td className="p-4">
                                            <input type="number" className="border rounded w-20 p-1" value={state.attended} onChange={e => setRosterState({...rosterState, [s.id]: { ...state, attended: e.target.value }})}/>
                                        </td>
                                        <td className="p-4">
                                            <input type="number" className="border rounded w-20 p-1" value={state.late} onChange={e => setRosterState({...rosterState, [s.id]: { ...state, late: e.target.value }})}/>
                                        </td>
                                        <td className="p-4">
                                            {isAbsent ? <span className="text-red-600 font-bold">ABSENT</span> : 
                                            isPartial ? <span className="text-orange-600 font-bold">PARTIAL</span> : 
                                            <span className="text-green-600 font-bold">PRESENT</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={handleSubmit} className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700">
                        Save Attendance
                    </button>
                </div>
            </div>
          ) : (
            <div className="p-8 bg-white rounded text-center text-gray-500">No approved students enrolled in this course yet.</div>
          )}
        </>
      )}
    </div>
  );
}
