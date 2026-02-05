import { Metadata } from 'next';
import InstructorCoursesClient from './_components/InstructorCoursesClient';

export const metadata: Metadata = {
  title: 'Instructor: My Courses',
};

export default function InstructorCoursesPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          My Courses
        </h1>
        <p className="text-slate-500 mt-1">
          Select a course to view student rosters and upload materials.
        </p>
      </div>
      <InstructorCoursesClient />
    </div>
  );
}
