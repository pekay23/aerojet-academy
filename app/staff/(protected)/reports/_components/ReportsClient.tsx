"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Clock, AlertTriangle, Download, Printer, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

export default function ReportsClient() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // PDF Print Ref
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
  contentRef: printRef, // Use contentRef instead of content function
  documentTitle: "Official_Transcript",
});

  useEffect(() => {
    // Fetch Attendance Stats
    fetch('/api/staff/reports/attendance')
      .then(res => res.json())
      .then(data => {
        setReportData(data.report || []);
        setLoading(false);
      })
      .catch(() => toast.error("Failed to load reports"));
  }, []);

  const highRiskCount = reportData.filter(s => s.riskLevel === 'CRITICAL').length;
  const lateCount = reportData.filter(s => s.riskLevel === 'WARNING').length;

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border border-border rounded-xl">
          <TabsTrigger value="attendance" className="px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Attendance Analytics</TabsTrigger>
          <TabsTrigger value="transcripts" className="px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Academic Transcripts</TabsTrigger>
        </TabsList>

        {/* --- ATTENDANCE ANALYTICS --- */}
        <TabsContent value="attendance" className="space-y-6 animate-in fade-in">
          <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900 shadow-sm">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-orange-800 dark:text-orange-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4"/> Lateness Warnings
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-4xl font-black text-orange-900 dark:text-orange-100">{lateCount}</div>
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 font-medium">Students frequently late</p>
                  </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 shadow-sm">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-red-800 dark:text-red-300 flex items-center gap-2">
                          <Clock className="w-4 h-4"/> Critical Absences
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-4xl font-black text-red-900 dark:text-red-100">{highRiskCount}</div>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-medium">Below 85% attendance</p>
                  </CardContent>
              </Card>
          </div>

          <Card className="border-border bg-card shadow-sm">
              <CardHeader><CardTitle>Lateness Overview</CardTitle></CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Attendance Rate</TableHead>
                              <TableHead>Lateness Count</TableHead>
                              <TableHead>Minutes Lost</TableHead>
                              <TableHead>Risk Status</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {reportData.map((student: any) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-bold text-foreground">{student.name}</TableCell>
                                <TableCell>
                                    <span className={`font-mono font-bold ${student.attendanceRate < 85 ? 'text-red-600' : 'text-green-600'}`}>
                                        {student.attendanceRate}%
                                    </span>
                                </TableCell>
                                <TableCell>{student.lateCount}</TableCell>
                                <TableCell>{student.lateMinutes} mins</TableCell>
                                <TableCell>
                                    {student.riskLevel === 'CRITICAL' && <Badge variant="destructive">CRITICAL</Badge>}
                                    {student.riskLevel === 'WARNING' && <Badge className="bg-orange-500 text-white">WARNING</Badge>}
                                    {student.riskLevel === 'GOOD' && <Badge variant="outline" className="text-green-600 border-green-200">GOOD</Badge>}
                                </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
        </TabsContent>

        {/* --- TRANSCRIPTS --- */}
        <TabsContent value="transcripts" className="space-y-6 animate-in fade-in">
          <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30">
                  <CardTitle>Transcript Generation</CardTitle>
                  <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export CSV</Button>
              </CardHeader>
              <CardContent className="p-0">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Cohort</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {reportData.map((student: any) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-bold text-foreground">{student.name}</TableCell>
                                <TableCell>General</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setTimeout(handlePrint, 100); // Wait for state update before print
                                        }}
                                        className="hover:border-primary hover:text-primary"
                                    >
                                        <Printer className="w-4 h-4 mr-2"/> Print Transcript
                                    </Button>
                                </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <div style={{ display: "none" }}>
        <div ref={printRef} className="p-10 bg-white text-black font-serif">
            {selectedStudent && (
                <div className="max-w-3xl mx-auto border-2 border-black p-8">
                    <div className="text-center border-b-2 border-black pb-6 mb-6">
                        <h1 className="text-3xl font-bold uppercase tracking-widest">Aerojet Aviation Academy</h1>
                        <p className="text-sm uppercase tracking-wider mt-2">Official Academic Transcript</p>
                    </div>
                    
                    <div className="flex justify-between mb-8">
                        <div>
                            <p className="font-bold">Student Name:</p>
                            <p className="text-xl">{selectedStudent.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">Date Issued:</p>
                            <p>{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <table className="w-full border-collapse border border-black mb-8">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-2 text-left">Module</th>
                                <th className="border border-black p-2 text-center">Credits</th>
                                <th className="border border-black p-2 text-center">Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-2">Attendance Record</td>
                                <td className="border border-black p-2 text-center">-</td>
                                <td className="border border-black p-2 text-center">{selectedStudent.attendanceRate}%</td>
                            </tr>
                            {/* Map real grades here later */}
                        </tbody>
                    </table>

                    <div className="mt-12 pt-8 border-t border-black flex justify-between items-end">
                        <div className="text-center">
                            <div className="w-40 border-b border-black mb-2"></div>
                            <p className="text-xs font-bold uppercase">Registrar Signature</p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 border border-black rounded-full flex items-center justify-center">
                                <span className="text-[10px]">OFFICIAL SEAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

    </div>
  );
}
