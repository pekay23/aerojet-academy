"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AttendanceClient() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/attendance').then(res=>res.json()).then(data => { setRecords(data.records || []); setLoading(false); });
  }, []);

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-aerojet-blue">Attendance Record</h1>
      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                    {records.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No attendance records.</TableCell></TableRow> : (
                        records.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                                <TableCell>{r.course.title}</TableCell>
                                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
