"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckSquare, Save, Camera, Smartphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ATTENDANCE_STATUSES = [
    { value: 'PRESENT', label: 'Present', color: 'bg-green-600' },
    { value: 'ABSENT_EXCUSED', label: 'Excused', color: 'bg-yellow-600' },
    { value: 'ABSENT_UNEXCUSED', label: 'Absent', color: 'bg-red-600' },
    { value: 'LATE', label: 'Late', color: 'bg-amber-500' },
];

export default function InstructorAttendanceClient() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [records, setRecords] = useState<Record<string, { status: string; comment: string; existingId?: string }>>({});
    const [loading, setLoading] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Load classes
    useEffect(() => {
        fetch('/api/instructor/classes')
            .then(res => res.json())
            .then(data => { setClasses(data.classes || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Load attendance when course or date changes
    useEffect(() => {
        if (!selectedCourseId) return;
        setLoadingRecords(true);
        fetch(`/api/instructor/attendance?courseId=${selectedCourseId}&date=${selectedDate}`)
            .then(res => res.json())
            .then(data => {
                setStudents(data.students || []);
                // Pre-populate records from existing data
                const existingRecords: Record<string, any> = {};
                (data.records || []).forEach((r: any) => {
                    existingRecords[r.studentId] = {
                        status: r.status,
                        comment: r.comment || '',
                        existingId: r.id
                    };
                });
                // Initialize all students with UNSPECIFIED if no record exists
                const allRecords: Record<string, any> = {};
                (data.students || []).forEach((s: any) => {
                    allRecords[s.id] = existingRecords[s.id] || { status: 'PRESENT', comment: '' };
                });
                setRecords(allRecords);
                setLoadingRecords(false);
            })
            .catch(() => setLoadingRecords(false));
    }, [selectedCourseId, selectedDate]);

    const handleSave = async () => {
        if (!selectedCourseId) return;
        setSaving(true);
        try {
            const recordsArray = Object.entries(records).map(([studentId, data]) => ({
                studentId,
                status: data.status,
                comment: data.comment,
                existingId: data.existingId
            }));

            const res = await fetch('/api/instructor/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: selectedCourseId,
                    date: selectedDate,
                    records: recordsArray
                })
            });

            if (res.ok) {
                toast.success(`Attendance saved for ${recordsArray.length} students!`);
            } else {
                toast.error("Failed to save attendance");
            }
        } catch {
            toast.error("Error saving attendance");
        } finally {
            setSaving(false);
        }
    };

    const markAllPresent = () => {
        const updated = { ...records };
        Object.keys(updated).forEach(id => {
            updated[id] = { ...updated[id], status: 'PRESENT' };
        });
        setRecords(updated);
    };

    const startQRScanner = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setScannerActive(true);
            toast.info("QR Scanner active — show student badges to the camera.");
        } catch {
            toast.error("Camera access denied. Please allow camera permissions.");
        }
    };

    const stopQRScanner = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setScannerActive(false);
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#4c9ded]" /></div>;
    }

    const presentCount = Object.values(records).filter(r => r.status === 'PRESENT').length;
    const totalCount = Object.keys(records).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Attendance Register</h1>
                <p className="text-muted-foreground">Take and manage daily attendance for your classes.</p>
            </div>

            {/* Course & Date Selector */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="w-full sm:w-[300px]">
                        <SelectValue placeholder="Select a course..." />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map(cls => (
                            <SelectItem key={cls.courseId} value={cls.courseId}>
                                {cls.courseCode} — {cls.courseTitle} ({cls.cohortCode})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full sm:w-[200px]"
                />
            </div>

            {selectedCourseId && (
                <Tabs defaultValue="manual" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="qr"><Camera className="w-4 h-4 mr-1" /> QR Scanner</TabsTrigger>
                        <TabsTrigger value="nfc"><Smartphone className="w-4 h-4 mr-1" /> NFC Tap</TabsTrigger>
                    </TabsList>

                    {/* Manual Entry Tab */}
                    <TabsContent value="manual">
                        {loadingRecords ? (
                            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-sm">
                                            {presentCount}/{totalCount} Present
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={markAllPresent}>
                                            <CheckSquare className="w-4 h-4 mr-1" /> Mark All Present
                                        </Button>
                                    </div>
                                </div>

                                <Card className="bg-card border-border shadow-sm">
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Comment</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map((s: any) => (
                                                    <TableRow key={s.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={s.user?.image} />
                                                                    <AvatarFallback className="text-xs">{s.user?.name?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-medium">{s.user?.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{s.studentId || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={records[s.id]?.status || 'PRESENT'}
                                                                onValueChange={(val) => setRecords(prev => ({
                                                                    ...prev,
                                                                    [s.id]: { ...prev[s.id], status: val }
                                                                }))}
                                                            >
                                                                <SelectTrigger className="w-[140px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {ATTENDANCE_STATUSES.map(st => (
                                                                        <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                placeholder="Optional note..."
                                                                value={records[s.id]?.comment || ''}
                                                                onChange={(e) => setRecords(prev => ({
                                                                    ...prev,
                                                                    [s.id]: { ...prev[s.id], comment: e.target.value }
                                                                }))}
                                                                className="w-[200px]"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {students.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                            No students found for this course.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {students.length > 0 && (
                                    <div className="flex justify-end mt-4">
                                        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save Attendance
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* QR Scanner Tab */}
                    <TabsContent value="qr">
                        <Card className="bg-card border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> QR Code Scanner</CardTitle>
                                <CardDescription>Scan student ID badges to automatically mark attendance as Present.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!scannerActive ? (
                                    <div className="text-center py-8">
                                        <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                                        <Button onClick={startQRScanner} className="bg-blue-600 hover:bg-blue-700">
                                            <Camera className="w-4 h-4 mr-2" /> Start Scanner
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-3">Requires camera permission. Works best on mobile devices.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden max-w-md mx-auto">
                                            <video ref={videoRef} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 border-2 border-blue-500/50 rounded-lg pointer-events-none">
                                                <div className="absolute inset-[20%] border-2 border-white/70 rounded-sm" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <Badge variant="outline" className="mb-2">
                                                {presentCount}/{totalCount} Present
                                            </Badge>
                                            <div>
                                                <Button variant="destructive" size="sm" onClick={stopQRScanner}>
                                                    <X className="w-4 h-4 mr-1" /> Stop Scanner
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* NFC Tab */}
                    <TabsContent value="nfc">
                        <Card className="bg-card border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5" /> NFC Tag Reader</CardTitle>
                                <CardDescription>Tap student NFC badges to mark attendance. Only supported on Chrome for Android.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-muted-foreground mb-4">NFC reading requires Chrome on Android with Web NFC support.</p>
                                    <Badge variant="outline">
                                        {'NDEFReader' in window ? '✅ NFC Supported' : '❌ NFC Not Supported on this browser'}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-4">
                                        Alternatively, use the QR Scanner tab which works on all platforms.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {!selectedCourseId && (
                <Card className="p-12 text-center text-muted-foreground border-dashed">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Select a course to begin.</p>
                    <p className="text-sm mt-1">Choose a course from the dropdown above to take or view attendance.</p>
                </Card>
            )}
        </div>
    );
}
