"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PlayCircle, Loader2, Library } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyCoursesClient() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/student/courses')
        .then(res => res.json())
        .then(data => { setCourses(data.courses || []); setLoading(false); })
        .catch(() => setLoading(false));
  }, []);

  // --- LOADING STATE ---
  if (loading) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-aerojet-blue">My Courses</h1>
                <p className="text-muted-foreground">Access your learning materials and track progress.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}><CardHeader><Skeleton className="h-4 w-20" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-aerojet-blue">My Courses</h1>
        <p className="text-muted-foreground">Access your learning materials and track progress.</p>
      </div>

      {/* --- EMPTY STATE --- */}
      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <Library className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-700">No Modules Assigned</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">You have not been enrolled in a cohort yet. Once you are, your course modules will appear here.</p>
            <Button variant="outline" onClick={() => router.push('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      ) : (
        // --- COURSE LIST ---
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
                <Card key={course.id} className="hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-t-aerojet-blue flex flex-col" onClick={() => router.push(`/student/courses/${course.code}`)}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <Badge variant="outline" className="font-mono">{course.code}</Badge>
                            <span className="text-xs font-bold text-muted-foreground">SEMESTER {course.semester}</span>
                        </div>
                        <CardTitle className="line-clamp-2 mt-2 pt-2 text-lg">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                                    <span>Progress</span>
                                    <span>{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} className="h-2" />
                            </div>
                            <Button size="sm" variant="ghost" className="w-full text-aerojet-blue hover:bg-blue-50">
                                <PlayCircle className="w-4 h-4 mr-2"/> Continue Learning
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
