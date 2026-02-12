"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, FileText, Banknote, Calendar, ArrowUp, ArrowRight, Clock, TrendingUp, TrendingDown, Target, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SpotlightCard from '@/app/components/ui/SpotlightCard';
import { useSession } from 'next-auth/react';
import InstructorDashboardClient from './InstructorDashboardClient';

export default function DashboardClient() {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Widget States
    const [time, setTime] = useState(new Date());
    const [attendanceView, setAttendanceView] = useState<'INSTRUCTOR' | 'STUDENT'>('INSTRUCTOR');

    // Clock Timer
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Data
    useEffect(() => {
        fetch('/api/staff/dashboard')
            .then(res => res.json())
            .then(resData => { setData(resData); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading || !data) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#4c9ded]" /></div>;
    }

    // Branch by role: Instructor gets their own dashboard
    const userRole = (session?.user as any)?.role;
    if (userRole === 'INSTRUCTOR' || data.role === 'INSTRUCTOR') {
        return <InstructorDashboardClient />;
    }

    // Destructure Data (Admin/Staff only from here)
    const { studentStats, opsStats, teamStats, recentStudents, calendarEvents, windowTracker, attendance } = data;
    const firstName = session?.user?.name?.split(' ')[0] || 'Admin';

    const statItems = [
        { title: "Total Students", value: studentStats?.total || 0, icon: Users },
        { title: "Pending Apps", value: opsStats?.pendingApps || 0, icon: FileText },
        { title: "Pending Finance", value: opsStats?.verifyingPayments || 0, icon: Banknote },
        { title: "Total Staff", value: teamStats?.total || 0, icon: Users },
    ];

    const getDaysLeft = (date: string) => {
        const diff = new Date(date).getTime() - new Date().getTime();
        if (diff < 0) return "Past";
        return `${Math.ceil(diff / (1000 * 60 * 60 * 24))} days left`;
    };

    const currentAttendanceRate = attendanceView === 'INSTRUCTOR'
        ? (attendance?.instructorRate || 98.5)
        : (attendance?.studentRate || 0);

    return (
        <div className="space-y-8">

            {/* 0. WELCOME & TIME WIDGET */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded-xl border border-border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold">Welcome, {firstName}! 👋</h1>
                    <p className="text-muted-foreground">Here is your daily operational overview.</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-[#4c9ded]">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-sm text-muted-foreground">{time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            {/* 1. STATS CARDS (Spotlight) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statItems.map(item => (
                    <SpotlightCard key={item.title} className="p-6 bg-card border-border shadow-sm" spotlightColor="rgba(76, 157, 237, 0.15)">
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">{item.title}</h3>
                            <item.icon className="w-5 h-5 text-[#4c9ded]" />
                        </div>
                        <div className="text-3xl font-bold">{item.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">Current total</p>
                    </SpotlightCard>
                ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">

                {/* 2. RECENT STUDENTS (Col Span 3) */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-card border-border shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-[#4c9ded]">Recent Registrations</CardTitle>
                            <CardDescription>Newest users in the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentStudents?.length > 0 ? recentStudents.map((student: any) => (
                                    <div key={student.id} className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors cursor-pointer group" onClick={() => router.push(`/staff/students/${student.id}`)}>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="border-2 border-[#4c9ded]/20">
                                                <AvatarImage src={student.user.image} />
                                                <AvatarFallback className="bg-[#4c9ded]/10 text-[#4c9ded]">{student.user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-semibold group-hover:text-[#4c9ded] transition-colors">{student.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{student.user.email}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="icon" className="h-8 w-8 text-[#4c9ded] border-[#4c9ded]/30 hover:bg-[#4c9ded]/10">
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )) : <div className="text-center py-4 text-muted-foreground text-sm">No recent registrations.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. RIGHT COLUMN (Col Span 2) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ATTENDANCE CARD (Interactive) */}
                    <SpotlightCard className="p-6 bg-background! border-border! min-h-37.5 flex flex-col justify-between" spotlightColor="rgba(34, 197, 94, 0.15)">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-1">Attendance Rate</h3>
                                {/* Toggle Buttons */}
                                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => setAttendanceView('INSTRUCTOR')}
                                        className={`transition-colors ${attendanceView === 'INSTRUCTOR' ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Instr.
                                    </button>
                                    <span className="text-border">|</span>
                                    <button
                                        onClick={() => setAttendanceView('STUDENT')}
                                        className={`transition-colors ${attendanceView === 'STUDENT' ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Student
                                    </button>
                                </div>
                            </div>
                            <Clock className={`w-5 h-5 ${attendanceView === 'INSTRUCTOR' ? 'text-green-500' : 'text-blue-500'}`} />
                        </div>

                        <div className="mt-4">
                            <div className="text-3xl font-bold transition-all">{currentAttendanceRate}%</div>
                            <Progress
                                value={Number(currentAttendanceRate)}
                                className={`h-2 mt-3`}
                            // Note: Tailwind classes for progress indicator color are handled by Shadcn, 
                            // but you can override via css variable or just accept default primary color.
                            />
                        </div>
                    </SpotlightCard>

                    {/* CMS ACCESS CARD */}
                    <SpotlightCard className="p-6 bg-card border-border shadow-sm cursor-pointer group" spotlightColor="rgba(236, 72, 153, 0.15)" onClick={() => { window.open('/studio', '_blank'); }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold group-hover:text-pink-500 transition-colors">Manage Public Site</h3>
                                <p className="text-sm text-muted-foreground">Edit content, posts, and pages in Sanity Studio.</p>
                            </div>
                            <div className="p-3 bg-pink-500/10 rounded-full text-pink-500">
                                <Globe className="w-6 h-6" />
                            </div>
                        </div>
                    </SpotlightCard>

                    {/* REVENUE TARGET */}
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Target className="w-4 h-4" /> Revenue Target
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {windowTracker ? (
                                <div className="space-y-4">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-2xl font-bold">€{windowTracker.revenue.toLocaleString()}</span>
                                        <span className="text-xs text-muted-foreground">Goal: €{windowTracker.targetRevenue.toLocaleString()}</span>
                                    </div>
                                    <Progress value={(windowTracker.revenue / windowTracker.targetRevenue) * 100} className="h-2" />
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className={windowTracker.isGo ? "text-green-600" : "text-red-500"}>
                                            {windowTracker.isGo ? "GO ✅" : "NO-GO ⚠️"}
                                        </span>
                                        <span className="text-muted-foreground">{getDaysLeft(windowTracker.cutoff)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground text-sm py-2">No active event target.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* UPCOMING DEADLINES */}
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2 text-[#4c9ded]">
                                <Calendar className="w-4 h-4" /> Upcoming
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {calendarEvents?.length > 0 ? calendarEvents.slice(0, 3).map((event: any) => (
                                        <TableRow key={event.id} className="border-b border-border last:border-0 hover:bg-transparent">
                                            <TableCell className="py-3 text-sm font-medium">{event.title}</TableCell>
                                            <TableCell className="py-3 text-right text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="p-4 text-center text-xs text-muted-foreground">
                                                No upcoming events.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
