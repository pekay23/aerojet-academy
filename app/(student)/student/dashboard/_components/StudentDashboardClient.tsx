"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
// ✅ 1. Import your new component
import SpotlightCard from '@/app/components/ui/SpotlightCard'; 

export default function StudentDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... fetch logic ...
    // For now, let's mock data to see the UI
    setData({
        attendance: 92,
        activeCourses: 4,
        nextExam: "14 Days"
    });
    setLoading(false);
  }, []);

  if (loading || !data) { /* ... loading state ... */ }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">Your academic overview and schedule.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/student/courses')}>
            <BookOpen className="w-4 h-4 mr-2"/> My Courses
        </Button>
      </div>

      {/* ✅ 2. Use the Spotlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpotlightCard className="p-6 bg-aerojet-blue! border-blue-900!">
            <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-medium text-blue-200">Attendance</h3>
                <Clock className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{data.attendance}%</div>
            <Progress value={data.attendance} className="h-1.5 mt-4" />
        </SpotlightCard>
        
        <SpotlightCard className="p-6 bg-aerojet-blue! border-blue-900!">
            <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-medium text-blue-200">Active Courses</h3>
                <BookOpen className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{data.activeCourses}</div>
            <p className="text-xs text-blue-300 mt-4">Current Semester</p>
        </SpotlightCard>

        <SpotlightCard className="p-6 bg-aerojet-blue! border-blue-900!">
            <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-medium text-blue-200">Next Exam</h3>
                <Calendar className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{data.nextExam}</div>
            <p className="text-xs text-blue-300 mt-4">Physics M2 - Room 304</p>
        </SpotlightCard>
      </div>
    </div>
  );
}
