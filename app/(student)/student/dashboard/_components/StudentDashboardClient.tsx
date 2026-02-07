"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, Calendar, Clock, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const dashRes = await fetch('/api/portal/dashboard');
        const dashData = await dashRes.json();
        setData(dashData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading || !data) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground">Track your progress and upcoming schedule.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/student/courses')}>
            <BookOpen className="w-4 h-4 mr-2"/> Course Catalog
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <Progress value={92} className="h-1.5 mt-2" />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">Current Semester</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Next Exam</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">14 Days</div>
                <p className="text-xs text-muted-foreground">Physics M2 - Room 304</p>
            </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">My Current Modules</h2>
        <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <GraduationCap className="w-10 h-10 mb-2 opacity-50" />
                <p>Course content loading...</p>
                <Button variant="link" onClick={() => router.push('/student/courses')} className="mt-2 text-primary">
                    Go to My Courses Page
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
