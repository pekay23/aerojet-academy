"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Users, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function MyClassesClient() {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/instructor/classes')
            .then(res => res.json())
            .then(data => { setClasses(data.classes || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#4c9ded]" /></div>;
    }

    // Class Detail View
    if (selectedClass) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setSelectedClass(null)}>← Back</Button>
                    <div>
                        <h1 className="text-2xl font-bold">{selectedClass.courseCode} — {selectedClass.courseTitle}</h1>
                        <p className="text-muted-foreground">{selectedClass.cohortName} ({selectedClass.cohortCode}) • Semester {selectedClass.semester}</p>
                    </div>
                </div>

                {selectedClass.courseDescription && (
                    <Card className="bg-card border-border">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{selectedClass.courseDescription}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-card border-border">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg"><Users className="w-6 h-6 text-blue-500" /></div>
                            <div>
                                <p className="text-2xl font-bold">{selectedClass.studentCount}</p>
                                <p className="text-xs text-muted-foreground">Students Enrolled</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg"><BarChart3 className="w-6 h-6 text-green-500" /></div>
                            <div>
                                <p className="text-2xl font-bold">{selectedClass.attendanceRate !== null ? `${selectedClass.attendanceRate}%` : '—'}</p>
                                <p className="text-xs text-muted-foreground">Attendance Rate (30d)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg"><BookOpen className="w-6 h-6 text-purple-500" /></div>
                            <div>
                                <p className="text-2xl font-bold">{selectedClass.courseDuration || '—'}</p>
                                <p className="text-xs text-muted-foreground">Duration</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle>Student Roster</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedClass.students?.length > 0 ? selectedClass.students.map((s: any) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={s.user?.image} />
                                                    <AvatarFallback className="text-xs">{s.user?.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                {s.user?.name}
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{s.studentId || '—'}</Badge></TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{s.user?.email}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No students enrolled.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Classes List View
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Classes</h1>
                    <p className="text-muted-foreground">Courses assigned to you as an instructor.</p>
                </div>
            </div>

            {classes.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground border-dashed">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No classes assigned yet.</p>
                    <p className="text-sm mt-1">Classes will appear here once admin assigns courses to you.</p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map(cls => (
                        <Card
                            key={cls.id}
                            className="bg-card border-border shadow-sm cursor-pointer hover:shadow-md hover:border-[#4c9ded]/30 transition-all group"
                            onClick={() => setSelectedClass(cls)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">{cls.courseCode}</Badge>
                                    <Badge variant="secondary" className="text-xs">{cls.cohortCode}</Badge>
                                </div>
                                <CardTitle className="text-lg mt-2 group-hover:text-[#4c9ded] transition-colors">{cls.courseTitle}</CardTitle>
                                <CardDescription>{cls.cohortName} • Semester {cls.semester}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-sm">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold">{cls.studentCount}</span>
                                        </div>
                                        {cls.attendanceRate !== null && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <BarChart3 className="w-4 h-4 text-green-500" />
                                                <span className="font-semibold">{cls.attendanceRate}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#4c9ded] transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
