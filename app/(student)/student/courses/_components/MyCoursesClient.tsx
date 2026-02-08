"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PlayCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-aerojet-blue" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-aerojet-blue">My Courses</h1>
        <p className="text-muted-foreground">Access your learning materials and track progress.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">
                You are not enrolled in any modules yet.
            </div>
        ) : (
            courses.map(course => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-aerojet-blue" onClick={() => router.push(`/student/courses/${course.code}`)}>
                    <CardHeader>
                        <div className="flex justify-between">
                            <Badge variant="outline">{course.code}</Badge>
                            <span className="text-xs font-bold text-muted-foreground">SEM {course.semester}</span>
                        </div>
                        <CardTitle className="line-clamp-1 mt-2">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} className="h-2" />
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-muted-foreground">Next: {course.nextLesson}</span>
                                <Button size="sm" variant="ghost" className="text-aerojet-blue hover:bg-blue-50">
                                    <PlayCircle className="w-4 h-4 mr-2"/> Continue
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
