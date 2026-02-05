"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Check, X, Clock } from 'lucide-react';

export default function AttendanceClient() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  useEffect(() => {
    if (courseId) {
      // Fetch students enrolled in this course
      fetch(`/api/staff/roster/${courseId}`)
        .then(res => res.json())
        .then(data => setStudents(data.students || []));
    }
  }, [courseId]);

  const mark = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      attended: status === 'PRESENT' ? 1 : 0,
      scheduled: 1, // Default to 1 hour or fetch from course duration
      late: status === 'LATE' ? 15 : 0
    }));

    try {
      const res = await fetch('/api/portal/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, date: new Date(), records })
      });
      if (res.ok) toast.success("Attendance saved!");
      else toast.error("Failed to save.");
    } catch { toast.error("Error saving attendance."); }
  };

  if (!courseId) return <div>Please select a course from the "My Courses" page.</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(student => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.user.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    attendance[student.id] === 'PRESENT' ? 'bg-green-100 text-green-700' :
                    attendance[student.id] === 'ABSENT' ? 'bg-red-100 text-red-700' :
                    attendance[student.id] === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {attendance[student.id] || 'PENDING'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => mark(student.id, 'PRESENT')}><Check className="w-4 h-4 text-green-600" /></Button>
                    <Button size="sm" variant="outline" onClick={() => mark(student.id, 'ABSENT')}><X className="w-4 h-4 text-red-600" /></Button>
                    <Button size="sm" variant="outline" onClick={() => mark(student.id, 'LATE')}><Clock className="w-4 h-4 text-yellow-600" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t">
          <Button onClick={submitAttendance} className="w-full bg-aerojet-blue">Save Attendance Record</Button>
        </div>
      </CardContent>
    </Card>
  );
}
