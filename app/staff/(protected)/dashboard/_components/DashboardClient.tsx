"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CreditCard, Calendar as CalendarIcon, Gift, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar'; // Ensure shadcn calendar is installed

export default function DashboardClient() {
  const [stats, setStats] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetch('/api/staff/dashboard')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      
      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-aerojet-sky" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.studentStats?.total || 0} Total Enrolled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opsStats?.pendingApps || 0}</div>
            <p className="text-xs text-muted-foreground">Requires Review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamStats?.instructors || 0}</div>
            <p className="text-xs text-muted-foreground">Teaching Staff</p>
          </CardContent>
        </Card>

        <Card className="bg-aerojet-blue text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">School Period</CardTitle>
            <Clock className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">2026/2027 Academic Year</div>
            <p className="text-xs text-blue-200">Sep 2026 - Jul 2027</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-7">
        
        {/* Calendar Column */}
        <Card className="md:col-span-3">
          <CardHeader><CardTitle>Academic Calendar</CardTitle></CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Public Holiday
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Exam Week
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Column */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Upcoming Birthdays */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="flex items-center gap-2"><Gift className="w-4 h-4 text-pink-500"/> Upcoming Birthdays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock Data - Connect to API later */}
                {[
                  { name: "Kwame Doe", role: "Student", date: "Oct 12" },
                  { name: "Sarah Smith", role: "Instructor", date: "Oct 14" }
                ].map((b, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {b.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-slate-500">{b.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded">{b.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                 <div className="flex gap-3 text-sm">
                    <span className="text-slate-400 text-xs w-12 shrink-0">10:00 AM</span>
                    <p><span className="font-bold">Admin</span> approved <span className="font-bold">John Doe</span></p>
                 </div>
                 <div className="flex gap-3 text-sm">
                    <span className="text-slate-400 text-xs w-12 shrink-0">09:45 AM</span>
                    <p><span className="font-bold">System</span> verified payment #INV-2024</p>
                 </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
