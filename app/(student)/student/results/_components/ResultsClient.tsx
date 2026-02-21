"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResultsClient() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/results').then(res=>res.json()).then(data => { setResults(data.results || []); setLoading(false); });
  }, []);

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-aerojet-blue">Exam Results</h1>
      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Date</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                    {results.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No results yet.</TableCell></TableRow> : (
                        results.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium">{r.moduleCode}</TableCell>
                                <TableCell>{new Date(r.recordedAt).toLocaleDateString()}</TableCell>
                                <TableCell className="font-bold">{r.score}%</TableCell>
                                <TableCell><Badge variant={r.isPassed ? 'default' : 'destructive'} className={r.isPassed ? 'bg-green-600' : ''}>{r.isPassed ? 'PASS' : 'FAIL'}</Badge></TableCell>
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
