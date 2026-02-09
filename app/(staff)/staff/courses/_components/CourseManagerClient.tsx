"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CourseManagerClient() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We need an API to fetch courses for staff
        // fetch('/api/staff/courses').then(res => res.json())...
        setLoading(false); // Placeholder
    }, []);

    if (loading) return <Loader2 className="w-8 h-8 animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Course Management</h1>
                <Button><Plus className="w-4 h-4 mr-2" /> New Course</Button>
            </div>
            <Card>
                <CardHeader><CardTitle>Existing Courses</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No courses created yet.</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
