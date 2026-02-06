"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileCheck, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StaffDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("students");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/staff/dashboard')
      .then(async (res) => {
        if (res.status === 403) throw new Error("Unauthorized access.");
        if (!res.ok) throw new Error("Failed to load dashboard data.");
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-aerojet-sky" />
      </div>
    );
  }

  // 2. Error State (Handles the 403)
  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
        <p className="font-bold">Error: {error}</p>
        <p className="text-sm mt-2">Please ensure you are logged in as an Administrator.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Retry</Button>
      </div>
    );
  }

  // 3. DEFENSIVE CHECK: If stats is still null for some reason
  if (!stats) return null;

  // Now we define the stats array, because we know 'stats' is loaded
  const adminStats = [
    {
      title: "Total Students",
      value: stats.studentStats?.total || 0, // Using Optional Chaining + Default
      change: `+${stats.studentStats?.active || 0}`,
      trend: "up",
      subtitle: "Active enrollments",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Instructors",
      value: stats.teamStats?.instructors || 0,
      change: "Stable",
      trend: "neutral",
      subtitle: "Teaching staff",
      icon: BookOpen,
      color: "text-purple-600"
    },
    {
      title: "Pending Apps",
      value: stats.opsStats?.pendingApps || 0,
      change: "Required",
      trend: "up",
      subtitle: "Awaiting review",
      icon: FileCheck,
      color: "text-orange-600"
    },
    {
      title: "Verify Payments",
      value: stats.opsStats?.verifyingPayments || 0,
      change: "Action",
      trend: "down",
      subtitle: "Finance queue",
      icon: Calendar,
      color: "text-emerald-600"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ... rest of your JSX rendering adminStats ... */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Academy Management Command Center</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border border-border bg-card shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-500">{stat.change}</span>
                  <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    
      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-linear-to-br from-blue-500/5 to-transparent border-border hover:border-aerojet-sky transition-colors cursor-pointer group" onClick={() => router.push('/staff/applications')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Review Applications</h3>
              <p className="text-xs text-muted-foreground">{stats.opsStats.pendingApps} waiting for you</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-500/5 to-transparent border-border hover:border-purple-500 transition-colors cursor-pointer group" onClick={() => router.push('/staff/exams')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Exam Scheduling</h3>
              <p className="text-xs text-muted-foreground">Manage upcoming sittings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-emerald-500/5 to-transparent border-border hover:border-emerald-500 transition-colors cursor-pointer group" onClick={() => router.push('/staff/finance')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Finance Verify</h3>
              <p className="text-xs text-muted-foreground">{stats.opsStats.verifyingPayments} proof uploads to check</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real Data Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-auto border border-border">
          <TabsTrigger value="students" className="px-6 py-2.5 data-state-active:bg-background data-state-active:shadow-sm rounded-lg">
            Recent Students
            <Badge className="ml-2 bg-primary/10 text-primary border-none">{stats.studentStats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="px-6 py-2.5 data-state-active:bg-background data-state-active:shadow-sm rounded-lg">
            Today's Events
            <Badge className="ml-2 bg-orange-500/10 text-orange-600 border-none">{stats.calendarEvents.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="p-4 text-left font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Student Name</th>
                    <th className="p-4 text-left font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Email</th>
                    <th className="p-4 text-left font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Status</th>
                    <th className="p-4 text-left font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Joined</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentStudents?.map((student: any) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
                            {student.user.name?.[0]}
                          </div>
                          <span className="font-semibold text-foreground">{student.user.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">{student.user.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase border border-blue-500/20">
                          {student.enrollmentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(student.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
           <Card className="border-border bg-card p-0 overflow-hidden shadow-sm">
              <div className="divide-y divide-border">
                {stats.calendarEvents?.length > 0 ? (
                  stats.calendarEvents.map((e: any, i: number) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${e.type === 'EXAM' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                        <div>
                          <p className="font-bold text-foreground">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">{new Date(e.date).toLocaleDateString()}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground italic">No events scheduled for today.</div>
                )}
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
