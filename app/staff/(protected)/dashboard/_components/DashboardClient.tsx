"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CreditCard, Calendar as CalendarIcon, Clock, GraduationCap, ArrowUpRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardClient() {
  const [stats, setStats] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/staff/dashboard')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  // Filter events when a date is selected
  useEffect(() => {
    if (stats?.calendarEvents && date) {
      const eventsOnDate = stats.calendarEvents.filter((e: any) => 
        new Date(e.date).toDateString() === date.toDateString()
      );
      setSelectedEvents(eventsOnDate);
    }
  }, [date, stats]);

  if (!stats) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading analytics...</div>;

  const cardClass = "relative overflow-hidden border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group";

  return (
    <div className="space-y-8">
      
      {/* --- HERO STATS ROW --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Active Students - Blue Gradient */}
        <Card className={`${cardClass} bg-linear-to-br from-blue-600 to-blue-800 text-white`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Active Students</p>
                <h3 className="text-4xl font-black">{stats.studentStats?.active || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-200">
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-white mr-2">
                {stats.studentStats?.total} Total
              </span>
              Enrolled in system
            </div>
          </CardContent>
        </Card>
        
        {/* Pending Apps - Orange Gradient */}
        <Card className={`${cardClass} bg-linear-to-br from-orange-500 to-red-600 text-white`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Pending Applications</p>
                <h3 className="text-4xl font-black">{stats.opsStats?.pendingApps || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-orange-100 flex items-center gap-1 cursor-pointer hover:underline">
              Review Queue <ArrowUpRight className="w-3 h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Finance - Emerald Gradient */}
        <Card className={`${cardClass} bg-linear-to-br from-emerald-500 to-teal-700 text-white`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Verify Payments</p>
                <h3 className="text-4xl font-black">{stats.opsStats?.verifyingPayments || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-emerald-100">
              Transactions pending approval
            </div>
          </CardContent>
        </Card>

        {/* Staff Count - Slate/Dark */}
        <Card className={`${cardClass} bg-white border border-slate-100 text-slate-800`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Instructors</p>
                <h3 className="text-4xl font-black text-slate-900">{stats.teamStats?.instructors || 0}</h3>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Active teaching staff
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid gap-8 md:grid-cols-7">
        
        {/* Calendar Widget (Left 3 Cols) */}
        <Card className="md:col-span-3 border-none shadow-lg overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CalendarIcon className="w-5 h-5 text-aerojet-sky"/> Academic Calendar
            </CardTitle>
          </CardHeader>
          <div className="p-4 flex justify-center bg-white">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none"
              modifiers={{
                event: (date) => stats.calendarEvents.some((e:any) => new Date(e.date).toDateString() === date.toDateString())
              }}
              modifiersStyles={{
                event: { fontWeight: 'bold', color: '#2563eb', textDecoration: 'underline' }
              }}
            />
          </div>
          {/* Selected Date Events */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex-1 min-h-37.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Events for {date?.toLocaleDateString()}
            </h4>
            {selectedEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedEvents.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${e.type === 'EXAM' ? 'bg-purple-500' : 'bg-red-500'}`} />
                    <p className="text-sm font-medium text-slate-700">{e.title}</p>
                    <span className="ml-auto text-xs text-slate-400">
                      {new Date(e.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No events scheduled.</p>
            )}
          </div>
        </Card>

        {/* Right Column: Newest Students & School Year */}
        <div className="md:col-span-4 space-y-6">
          
          {/* School Year Card */}
          <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Clock className="w-32 h-32" />
            </div>
            <CardContent className="p-8 relative z-10">
               <h3 className="text-2xl font-bold mb-1">2026/2027 Academic Year</h3>
               <p className="text-blue-200 mb-6">Current Period: Semester 1</p>
               <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                 <div className="bg-aerojet-sky h-2 rounded-full" style={{ width: '35%' }}></div>
               </div>
               <div className="flex justify-between text-xs text-slate-400">
                 <span>Sep 2026</span>
                 <span>35% Complete</span>
                 <span>Jul 2027</span>
               </div>
            </CardContent>
          </Card>

          {/* Recent Students List */}
          <Card className="border-none shadow-lg">
            <CardHeader>
               <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {stats.recentStudents?.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.user.image} />
                        <AvatarFallback>{student.user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{student.user.name}</p>
                        <p className="text-xs text-slate-500">{student.studentId || 'Applicant'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
