import React from 'react';
import StudentListClient from './_components/StudentListClient';

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student Directory</h1>
      <StudentListClient />
    </div>
  );
}
