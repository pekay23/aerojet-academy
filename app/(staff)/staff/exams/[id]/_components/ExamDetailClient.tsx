"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExamDetailClient({ id }: { id: string }) {
  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/staff/exams/${id}`)
        .then(res => res.json())
        .then(data => { setPool(data.run || null); setLoading(false); }) // API might return 'run' or 'pool'
        .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  if (!pool) return <div>Pool not found.</div>;

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">{pool.name}</h1>
            <p className="text-muted-foreground">{new Date(pool.examDate).toLocaleDateString()} • {pool.examStartTime} - {pool.examEndTime}</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
                <CardContent><Badge>{pool.status}</Badge></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-sm">Capacity</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">{pool.memberships?.length || 0} / {pool.maxCandidates}</CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>Candidate Roster</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Module</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {pool.memberships?.map((m: any) => (
                            <TableRow key={m.id}>
                                <TableCell>{m.student.user.name}</TableCell>
                                <TableCell>{m.moduleCode}</TableCell>
                                <TableCell><Badge variant="outline">{m.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                        {(!pool.memberships || pool.memberships.length === 0) && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No candidates yet.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
