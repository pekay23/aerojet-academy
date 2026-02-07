"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/dashboard')
      .then(res => res.json())
      .then(d => {
        // Redirect if NOT enrolled (i.e. is Applicant)
        if (d.enrollmentStatus !== 'ENROLLED') {
            router.replace('/portal/applicant');
            return;
        }
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-aerojet-sky" /></div>;
  if (!data) return <div>Failed to load.</div>;

  const academicStats = [
    { title: "Enrolled Courses", value: data.enrolledCourses?.length || 0, icon: BookOpen, color: "text-blue-500" },
    { title: "Upcoming Exams", value: data.upcomingExams?.length || 0, icon: Calendar, color: "text-orange-500" },
    { title: "Attendance Rate", value: `${data.attendanceRate}%`, icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1><p className="text-muted-foreground mt-1">Academic Overview</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {academicStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-card shadow-sm border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div><p className="text-sm text-muted-foreground mb-1">{stat.title}</p><h3 className="text-3xl font-bold text-foreground">{stat.value}</h3></div>
                  <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}><Icon className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* --- RE-ADD YOUR COURSES/EXAMS TABS HERE FROM PREVIOUS VERSION --- */}
      <Tabs defaultValue="courses" className="space-y-4">
         <TabsList>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
         </TabsList>
         <TabsContent value="courses">
            {/* ... Course List ... */}
            <div className="p-4 bg-card border border-border rounded-lg text-center text-muted-foreground">Course list loaded.</div>
         </TabsContent>
         <TabsContent value="exams">
            {/* ... Exam List ... */}
            <div className="p-4 bg-card border border-border rounded-lg text-center text-muted-foreground">No upcoming exams.</div>
         </TabsContent>
      </Tabs>
    </div>
  );
}
