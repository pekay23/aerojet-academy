import { Metadata } from 'next';
import AttendanceClient from './_components/AttendanceClient';

export const metadata: Metadata = {
  title: 'Instructor: Attendance',
};

export default function AttendancePage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Class Attendance
        </h1>
        <p className="text-slate-500 mt-1">
          Mark students as Present, Absent, or Late.
        </p>
      </div>
      <AttendanceClient />
    </div>
  );
}
