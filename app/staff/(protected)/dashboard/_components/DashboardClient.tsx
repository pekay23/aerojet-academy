"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CreditCard, Calendar as CalendarIcon, Clock, GraduationCap, ArrowUpRight, Activity, ChevronRight, MapPin } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

const chartData = [
  { name: 'Jan', students: 40 },
  { name: 'Feb', students: 45 },
  { name: 'Mar', students: 60 },
  { name: 'Apr', students: 90 },
  { name: 'May', students: 110 },
  { name: 'Jun', students: 125 },
];

export default function DashboardClient() {
  const [stats, setStats] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Optimistic UI: Don't load events via API every click, filter locally instantly
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/staff/dashboard')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  // Instant Filter Logic
  useEffect(() => {
    if (stats?.calendarEvents && date) {
      const eventsOnDate = stats.calendarEvents.filter((e: any) => 
        new Date(e.date).toDateString() === date.toDateString()
      );
      setSelectedEvents(eventsOnDate);
    }
  }, [date, stats]);

  // SKELETON LOADING STATE (Optimistic Feel)
  if (!stats) {
    return (
        <div className="space-y-8 p-4">
            <div className="grid gap-6 md:grid-cols-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse shadow-sm" />)}
            </div>
            <div className="grid gap-8 md:grid-cols-7">
                <div className="md:col-span-3 h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse shadow-sm" />
                <div className="md:col-span-4 h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse shadow-sm" />
            </div>
        </div>
    );
  }

  const cardClass = "relative overflow-hidden border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- HERO STATS ROW --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Active Students - Blue Gradient */}
        <Card className={`${cardClass} bg-linear-to-br from-indigo-500 to-purple-600 text-white`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Active Students</p>
                <h3 className="text-4xl font-black">{stats.studentStats?.active || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-indigo-200">
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-white mr-2">
                {stats.studentStats?.total} Total
              </span>
              Enrolled in system
            </div>
          </CardContent>
        </Card>
        
        {/* Pending Apps - Orange Gradient */}
        <Card className={`${cardClass} bg-linear-to-br from-orange-500 to-red-600 text-white`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Pending Applications</p>
                <h3 className="text-4xl font-black">{stats.opsStats?.pendingApps || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
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
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Verify Payments</p>
                <h3 className="text-4xl font-black">{stats.opsStats?.verifyingPayments || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-emerald-100">
              Transactions pending approval
            </div>
          </CardContent>
        </Card>

        {/* Staff Count - Slate/Dark */}
        <Card className={`${cardClass} bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Instructors</p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.teamStats?.instructors || 0}</h3>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Active teaching staff
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- CHART & FEED --- */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-lg dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Enrollment Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2880b9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2880b9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="students" stroke="#2880b9" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

                {/* Activity Feed - Improved Contrast */}
        <Card className="border shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Activity className="w-5 h-5 text-aerojet-sky"/> Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-75 overflow-y-auto">
                {stats.recentStudents?.map((student: any) => (
                    <div key={student.id} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        {/* Status Dot */}
                        <div className="mt-1.5 relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
                        </div>
                        
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                                New Student Registered
                            </p>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">
                                <span className="text-aerojet-sky">{student.user.name}</span> joined the <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{student.cohort || 'General'}</span> cohort.
                            </p>
                            <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                                {new Date(student.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {(!stats.recentStudents || stats.recentStudents.length === 0) && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                        No recent activity recorded.
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* --- ENHANCED CALENDAR SECTION --- */}
      <div className="grid gap-8 md:grid-cols-7">
        
        {/* Calendar Widget (Left 3 Cols) */}
        <Card className="md:col-span-3 border-none shadow-lg overflow-hidden flex flex-col dark:bg-slate-900 bg-white h-full">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <CalendarIcon className="w-5 h-5 text-aerojet-sky"/> Academic Calendar
                </CardTitle>
                <Badge variant="outline" className="text-xs font-normal">
                    {new Date().toLocaleString('default', { month: 'long' })}
                </Badge>
            </div>
          </CardHeader>
          
          <div className="p-4 flex justify-center bg-white dark:bg-slate-900 min-h-80 items-start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none w-full max-w-full"
              classNames={{
                day_selected: "bg-aerojet-sky text-white hover:bg-aerojet-blue hover:text-white focus:bg-aerojet-sky focus:text-white",
                day_today: "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-slate-100",
              }}
              modifiers={{
                hasEvent: (date) => stats.calendarEvents.some((e:any) => new Date(e.date).toDateString() === date.toDateString())
              }}
              modifiersStyles={{
                hasEvent: { 
                    fontWeight: 'bold', 
                    color: '#2880b9',
                    textDecoration: 'underline decoration-2 decoration-aerojet-sky/30 underline-offset-4' 
                }
              }}
            />
          </div>

          {/* Agenda List */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-t border-slate-100 dark:border-slate-800 flex-1 overflow-y-auto max-h-75">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Agenda: {date?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                </h4>
                {selectedEvents.length > 0 && <Badge className="bg-aerojet-sky text-[10px]">{selectedEvents.length} Events</Badge>}
            </div>
            
            {selectedEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedEvents.map((e: any, i: number) => (
                  <div key={i} className="group flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:border-aerojet-sky cursor-pointer">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${e.type === 'EXAM' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-aerojet-blue transition-colors">{e.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3"/> 
                                {new Date(e.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {e.type === 'EXAM' && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3"/> Room A
                                </span>
                            )}
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-aerojet-sky" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 min-h-25">
                 <CalendarIcon className="w-8 h-8 opacity-20" />
                 <p className="text-sm">No events scheduled.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-32 h-32" /></div>
            <CardContent className="p-8 relative z-10">
               <h3 className="text-2xl font-bold mb-1">2026/2027 Academic Year</h3>
               <p className="text-blue-200 mb-6">Current Period: Semester 1</p>
               <div className="w-full bg-white/10 rounded-full h-2 mb-2"><div className="bg-aerojet-sky h-2 rounded-full" style={{ width: '35%' }}></div></div>
               <div className="flex justify-between text-xs text-slate-400"><span>Sep 2026</span><span>35% Complete</span><span>Jul 2027</span></div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg dark:bg-slate-900">
            <CardHeader><CardTitle>Recent Enrollments</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentStudents?.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.user.image} />
                        <AvatarFallback>{student.user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{student.user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{student.studentId || 'Applicant'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">{new Date(student.createdAt).toLocaleDateString()}</span>
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
