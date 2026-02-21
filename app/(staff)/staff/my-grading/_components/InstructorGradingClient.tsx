"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, PenTool, Save, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function InstructorGradingClient() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [courseInfo, setCourseInfo] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<Record<string, { score: string; comments: string }>>({});
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load classes
    useEffect(() => {
        fetch('/api/instructor/classes')
            .then(res => res.json())
            .then(data => { setClasses(data.classes || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Load students + grades when course changes
    useEffect(() => {
        if (!selectedCourseId) return;
        setLoadingStudents(true);
        fetch(`/api/instructor/grades?courseId=${selectedCourseId}`)
            .then(res => res.json())
            .then(data => {
                setCourseInfo(data.course);
                setStudents(data.students || []);
                // Initialize grades for students without existing locked grades
                const initGrades: Record<string, any> = {};
                (data.students || []).forEach((s: any) => {
                    if (!s.existingGrade?.isLocked) {
                        initGrades[s.id] = {
                            score: s.existingGrade?.score?.toString() || '',
                            comments: s.existingGrade?.comments || ''
                        };
                    }
                });
                setGrades(initGrades);
                setLoadingStudents(false);
            })
            .catch(() => setLoadingStudents(false));
    }, [selectedCourseId]);

    const handleSubmitGrades = async () => {
        if (!selectedCourseId) return;
        setSaving(true);
        try {
            // Only submit grades that have a score
            const gradeEntries = Object.entries(grades)
                .filter(([, data]) => data.score !== '')
                .map(([studentId, data]) => ({
                    studentId,
                    score: data.score,
                    comments: data.comments
                }));

            if (gradeEntries.length === 0) {
                toast.error("No grades to submit. Please enter at least one score.");
                setSaving(false);
                return;
            }

            const res = await fetch('/api/instructor/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: selectedCourseId, grades: gradeEntries })
            });

            const result = await res.json();
            if (res.ok) {
                toast.success(`${result.created} grade(s) submitted and locked!${result.skipped > 0 ? ` ${result.skipped} already locked.` : ''}`);
                // Refresh to show locked state
                setSelectedCourseId(selectedCourseId);
                // Re-fetch to reflect lock
                const refreshRes = await fetch(`/api/instructor/grades?courseId=${selectedCourseId}`);
                const refreshData = await refreshRes.json();
                setStudents(refreshData.students || []);
                setGrades({});
            } else {
                toast.error(result.error || "Failed to submit grades");
            }
        } catch {
            toast.error("Error submitting grades");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#4c9ded]" /></div>;
    }

    const ungradedCount = students.filter(s => !s.existingGrade?.isLocked).length;
    const gradedCount = students.filter(s => s.existingGrade?.isLocked).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Grading</h1>
                <p className="text-muted-foreground">Submit grades for your courses. Grades are locked after submission.</p>
            </div>

            {/* Course Selector */}
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full sm:w-[400px]">
                    <SelectValue placeholder="Select a course to grade..." />
                </SelectTrigger>
                <SelectContent>
                    {classes.map(cls => (
                        <SelectItem key={cls.courseId} value={cls.courseId}>
                            {cls.courseCode} — {cls.courseTitle} ({cls.cohortCode})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedCourseId && loadingStudents && (
                <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            )}

            {selectedCourseId && !loadingStudents && (
                <>
                    {/* Stats */}
                    <div className="flex gap-3">
                        <Badge variant="outline" className="text-sm">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> {gradedCount} Graded
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                            <PenTool className="w-3 h-3 mr-1 text-amber-500" /> {ungradedCount} Pending
                        </Badge>
                    </div>

                    {/* Grading Table */}
                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Score (%)</TableHead>
                                        <TableHead>Pass/Fail</TableHead>
                                        <TableHead>Comments</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((s: any) => {
                                        const isLocked = s.existingGrade?.isLocked;
                                        const score = isLocked ? s.existingGrade.score : (grades[s.id]?.score || '');
                                        const numScore = parseFloat(score as string);
                                        const isPassed = !isNaN(numScore) && numScore >= 75;

                                        return (
                                            <TableRow key={s.id} className={isLocked ? 'bg-muted/30' : ''}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={s.image} />
                                                            <AvatarFallback className="text-xs">{s.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">{s.name}</p>
                                                            <p className="text-xs text-muted-foreground">{s.studentId || s.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {isLocked ? (
                                                        <span className="font-bold text-lg">{s.existingGrade.score}</span>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="w-20"
                                                            value={grades[s.id]?.score || ''}
                                                            onChange={(e) => setGrades(prev => ({
                                                                ...prev,
                                                                [s.id]: { ...prev[s.id], score: e.target.value, comments: prev[s.id]?.comments || '' }
                                                            }))}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {score !== '' && !isNaN(numScore) ? (
                                                        <Badge className={isPassed ? "bg-green-600" : "bg-red-600"}>
                                                            {isPassed ? "PASS" : "FAIL"}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isLocked ? (
                                                        <span className="text-sm text-muted-foreground">{s.existingGrade.comments || '—'}</span>
                                                    ) : (
                                                        <Input
                                                            placeholder="Optional..."
                                                            className="w-[160px]"
                                                            value={grades[s.id]?.comments || ''}
                                                            onChange={(e) => setGrades(prev => ({
                                                                ...prev,
                                                                [s.id]: { ...prev[s.id], comments: e.target.value, score: prev[s.id]?.score || '' }
                                                            }))}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isLocked ? (
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Lock className="w-4 h-4" />
                                                            <span className="text-xs">{new Date(s.existingGrade.recordedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-amber-600">Pending</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {students.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No students found for this course.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Submit Button with Confirmation */}
                    {ungradedCount > 0 && Object.values(grades).some(g => g.score !== '') && (
                        <div className="flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Submit & Lock Grades
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Submit Grades?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is <strong>permanent</strong>. Once submitted, grades will be locked and cannot be modified.
                                            Make sure all scores are correct before proceeding.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Review Again</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSubmitGrades} className="bg-purple-600 hover:bg-purple-700">
                                            <Lock className="w-4 h-4 mr-1" /> Confirm & Lock
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </>
            )}

            {!selectedCourseId && (
                <Card className="p-12 text-center text-muted-foreground border-dashed">
                    <PenTool className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Select a course to grade.</p>
                    <p className="text-sm mt-1">Choose a course from the dropdown above to view and enter grades.</p>
                </Card>
            )}
        </div>
    );
}
