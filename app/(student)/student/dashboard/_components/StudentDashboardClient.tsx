"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SpotlightCard from '@/app/components/ui/SpotlightCard';

export default function StudentDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/student/dashboard');
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
        // Fallback to mock if API fails (or for demo)
        setData({
          attendance: 0,
          activeCourses: 0,
          nextExam: "N/A"
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Your academic overview and schedule.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/student/courses')}>
          <BookOpen className="w-4 h-4 mr-2" /> My Courses
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard className="p-6 bg-blue-950 border-blue-900 text-white">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-medium text-blue-200">Attendance</h3>
            <Clock className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-3xl font-bold mt-2">{data?.attendance || 0}%</div>
          <Progress value={data?.attendance || 0} className="h-1.5 mt-4 bg-blue-800" indicatorClassName="bg-blue-400" />
        </SpotlightCard>

        <SpotlightCard className="p-6 bg-blue-950 border-blue-900 text-white">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-medium text-blue-200">Active Courses</h3>
            <BookOpen className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-3xl font-bold mt-2">{data?.activeCourses || 0}</div>
          <p className="text-xs text-blue-300 mt-4">Current Semester</p>
        </SpotlightCard>

        <SpotlightCard className="p-6 bg-blue-950 border-blue-900 text-white">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-medium text-blue-200">Next Exam</h3>
            <Calendar className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-3xl font-bold mt-2">{data?.nextExam || "None"}</div>
          <p className="text-xs text-blue-300 mt-4">{data?.nextExamDetail || "No upcoming exams"}</p>
        </SpotlightCard>
      </div>
    </div>
  );
}
