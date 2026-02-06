"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, GraduationCap, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle'; // Ensuring toggle is here if you want it on dashboard too

export default function StudentDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) return <div>Failed to load dashboard.</div>;

  const academicStats = [
    { title: "Enrolled Courses", value: data.enrolledCourses?.length || 0, icon: BookOpen, color: "text-blue-500" },
    { title: "Upcoming Exams", value: data.upcomingExams?.length || 0, icon: Calendar, color: "text-orange-500" },
    { title: "Attendance Rate", value: `${data.attendanceRate}%`, icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {data.name}!</h1>
          <p className="text-muted-foreground mt-1">Academic Year 2026/27</p>
        </div>
        {/* Optional: Add Theme Toggle here if not in header */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {academicStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-card shadow-sm border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}><Icon className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Active Modules</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {data.enrolledCourses?.map((course: any) => (
                <div key={course.id} className="p-4 border border-border rounded-lg flex justify-between items-center hover:bg-muted/30 transition">
                  <div>
                    <p className="font-bold text-foreground">{course.code} - {course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.duration || 'Self-Paced'}</p>
                  </div>
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-medium">Active</span>
                </div>
              ))}
              {(!data.enrolledCourses || data.enrolledCourses.length === 0) && <p className="text-muted-foreground text-sm">No active courses.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
           <Card className="bg-card border-border">
             <CardHeader><CardTitle>Exam Schedule</CardTitle></CardHeader>
             <CardContent>
               {data.upcomingExams?.length > 0 ? (
                 <div className="space-y-2">
                   {data.upcomingExams.map((booking: any) => (
                     <div key={booking.id} className="flex justify-between p-3 border-b border-border last:border-0">
                       <span className="font-medium">{booking.run.course.title}</span>
                       <span className="text-muted-foreground">{new Date(booking.run.startDatetime).toLocaleDateString()}</span>
                     </div>
                   ))}
                 </div>
               ) : <p className="text-muted-foreground text-sm">No upcoming exams.</p>}
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
