import { Metadata } from 'next';
import ExamSchedulerClient from './_components/ExamSchedulerClient';

export const metadata: Metadata = {
  title: 'Staff: Exam Scheduling',
};

export default function ExamManagementPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Exam Scheduling
        </h1>
        <p className="text-slate-500 mt-1">
          Create exam sessions, assign rooms, and view bookings.
        </p>
      </div>
      <ExamSchedulerClient />
    </div>
  );
}
