"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, FileText, Banknote, Calendar, ArrowUp, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SpotlightCard from '@/app/components/ui/SpotlightCard';

export default function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/staff/dashboard')
      .then(res => res.json())
      .then(resData => { setData(resData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#4c9ded]"/></div>;
  }

  const { studentStats, opsStats, teamStats, recentStudents, calendarEvents } = data;

  const statItems = [
    { title: "Total Students", value: studentStats?.total || 0, icon: Users },
    { title: "Pending Apps", value: opsStats?.pendingApps || 0, icon: FileText },
    { title: "Pending Finance", value: opsStats?.verifyingPayments || 0, icon: Banknote },
    { title: "Total Staff", value: (teamStats?.staff || 0) + (teamStats?.instructors || 0) + (teamStats?.admins || 0), icon: Users },
  ];

  return (
    <div className="space-y-8">
      
      {/* STATS CARDS - With Aerojet Sky Spotlight */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map(item => (
            <SpotlightCard key={item.title} className="p-6 bg-card border-border shadow-sm" spotlightColor="rgba(76, 157, 237, 0.15)">
                <div className="flex justify-between items-center pb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{item.title}</h3>
                    {/* Aerojet Sky Icon */}
                    <item.icon className="w-5 h-5 text-[#4c9ded]" />
                </div>
                <div className="text-3xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <span className="text-green-500 flex items-center"><ArrowUp className="w-3 h-3"/> +2.1%</span> vs last month
                </p>
            </SpotlightCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* RECENT STUDENTS */}
        <div className="lg:col-span-3">
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-[#4c9ded]">Recent Registrations</CardTitle>
                    <CardDescription>Newest users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentStudents?.slice(0, 5).map((student: any) => (
                        <div key={student.id} className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors">
                            <div className="flex items-center gap-4">
                                <Avatar className="border-2 border-[#4c9ded]/20">
                                    <AvatarImage src={student.user.image} />
                                    <AvatarFallback className="bg-[#4c9ded]/10 text-[#4c9ded]">{student.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold">{student.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.user.email}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#4c9ded] border-[#4c9ded]/30 hover:bg-[#4c9ded]/10" onClick={() => router.push(`/staff/students/${student.id}`)}>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* CALENDAR */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#4c9ded]"><Calendar className="w-5 h-5"/> Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                    <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Event</TableHead>
                        <TableHead className="text-right text-muted-foreground">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {calendarEvents?.slice(0, 4).map((event: any) => (
                    <TableRow key={event.id} className="border-border">
                      <TableCell>
                          <div className="font-medium text-foreground">{event.title}</div>
                          <Badge variant="outline" className="mt-1 border-[#4c9ded]/30 text-[#4c9ded] bg-[#4c9ded]/5">{event.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
