"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function InstructorCoursesClient() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/staff/courses')
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.length > 0 ? (
        courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {course.code}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-aerojet-sky" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 mb-1">{course.title}</div>
              <p className="text-xs text-slate-500 mb-4">
                EASA Part-66 Module
              </p>
              <Link href={`/staff/attendance?courseId=${course.id}`}>
                <Button className="w-full bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200 group-hover:border-aerojet-sky transition-colors">
                  Take Attendance <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-3 text-center py-12 text-slate-500">
          You are not assigned to any courses yet.
        </div>
      )}
    </div>
  );
}
