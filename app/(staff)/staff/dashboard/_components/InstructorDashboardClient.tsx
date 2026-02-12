"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Users, CheckSquare, PenTool, ArrowRight, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SpotlightCard from '@/app/components/ui/SpotlightCard';
import { useSession } from 'next-auth/react';

export default function InstructorDashboardClient() {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch('/api/staff/dashboard')
            .then(res => res.json())
            .then(resData => { setData(resData); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading || !data) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#4c9ded]" /></div>;
    }

    const { stats, myClasses, recentGrades, calendarEvents } = data;
    const firstName = session?.user?.name?.split(' ')[0] || 'Instructor';

    const statItems = [
        { title: "My Classes", value: stats?.classes || 0, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "My Students", value: stats?.students || 0, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { title: "Today's Attendance", value: stats?.todayAttendance?.total > 0 ? `${stats.todayAttendance.present}/${stats.todayAttendance.total}` : '—', icon: CheckSquare, color: "text-amber-500", bg: "bg-amber-500/10" },
        { title: "Grades Recorded", value: stats?.gradesRecorded || 0, icon: PenTool, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="space-y-8">

            {/* Welcome Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold">Welcome, {firstName}! 👋</h1>
                    <p className="text-blue-100 mt-1">Here&apos;s your teaching overview for today.</p>
                </div>
                <div className="text-right mt-4 md:mt-0">
                    <div className="text-3xl font-mono font-bold text-white/90">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-sm text-blue-200">{time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statItems.map(item => (
                    <SpotlightCard key={item.title} className="p-6 bg-card border-border shadow-sm" spotlightColor="rgba(76, 157, 237, 0.15)">
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">{item.title}</h3>
                            <div className={`p-2 rounded-lg ${item.bg}`}>
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{item.value}</div>
                    </SpotlightCard>
                ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">

                {/* My Classes */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-[#4c9ded]">My Classes</CardTitle>
                                <CardDescription>Courses assigned to you.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/staff/my-classes')}>
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {myClasses?.length > 0 ? (
                                <div className="space-y-3">
                                    {myClasses.map((cls: any) => (
                                        <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/staff/my-classes')}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{cls.courseCode} — {cls.courseTitle}</p>
                                                    <p className="text-xs text-muted-foreground">{cls.cohortName} ({cls.cohortCode})</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{cls.studentCount} students</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">No classes assigned yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Quick Actions */}
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/staff/my-attendance')}>
                                <CheckSquare className="w-4 h-4 mr-2 text-amber-500" /> Take Attendance
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/staff/my-grading')}>
                                <PenTool className="w-4 h-4 mr-2 text-purple-500" /> Grade Students
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Grades */}
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-purple-600 flex items-center gap-2">
                                <PenTool className="w-4 h-4" /> Recent Grades
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {recentGrades?.length > 0 ? recentGrades.map((g: any) => (
                                        <TableRow key={g.id} className="border-b border-border last:border-0">
                                            <TableCell className="py-3 text-sm font-medium">{g.studentName}</TableCell>
                                            <TableCell className="py-3"><Badge variant="outline">{g.moduleCode}</Badge></TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Badge className={g.isPassed ? "bg-green-600" : "bg-red-600"}>{g.score}%</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="p-4 text-center text-xs text-muted-foreground">No grades recorded yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Upcoming Events */}
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
                                            <TableCell colSpan={2} className="p-4 text-center text-xs text-muted-foreground">No upcoming events.</TableCell>
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
