"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ResultsEntryClient() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});

  useEffect(() => {
    // 1. Fetch available exam runs to grade
    fetch('/api/staff/exams')
      .then(res => res.json())
      .then(data => setRuns(data.runs || []));
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      // 2. When run selected, fetch the specific roster for it
      fetch(`/api/staff/exams/${selectedRunId}`)
        .then(res => res.json())
        .then(data => {
          setStudents(data.run?.bookings || []);
        });
    }
  }, [selectedRunId]);

  const handleScoreChange = (studentId: string, val: string) => {
    setScores(prev => ({ ...prev, [studentId]: val }));
  };

  const submitGrades = async () => {
    const results = Object.entries(scores).map(([studentId, score]) => ({
      studentId,
      score
    }));

    try {
      const res = await fetch('/api/staff/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examRunId: selectedRunId, results })
      });

      if (res.ok) toast.success("Results published successfully!");
      else toast.error("Failed to publish results.");
    } catch { toast.error("Error submitting grades."); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <label className="block text-sm font-medium mb-2">Select Exam Session</label>
          <Select onValueChange={setSelectedRunId}>
            <SelectTrigger className="w-full md:w-100">
              <SelectValue placeholder="Choose an exam to grade..." />
            </SelectTrigger>
            <SelectContent>
              {runs.map(run => (
                <SelectItem key={run.id} value={run.id}>
                  {run.course.code} - {new Date(run.startDatetime).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedRunId && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Exam ID</TableHead>
                  <TableHead className="w-37.5">Score (0-100)</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((booking) => {
                  const score = parseFloat(scores[booking.student.id] || '0');
                  const isPass = score >= 75;
                  
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.student.user.name}</TableCell>
                      <TableCell className="font-mono text-slate-500">{booking.seatLabel || 'N/A'}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="0" max="100" 
                          placeholder="0"
                          onChange={(e) => handleScoreChange(booking.student.id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {scores[booking.student.id] ? (
                          <span className={`font-bold ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        ) : <span className="text-slate-300">-</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="p-4 border-t bg-slate-50">
              <Button onClick={submitGrades} className="w-full md:w-auto bg-aerojet-blue">
                Publish All Grades
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
