"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, DollarSign, Users, GraduationCap, ClipboardCheck,
  Download, TrendingUp, TrendingDown, BarChart3,
  LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface FinanceStats {
  totalRevenue: number;
  outstandingAmount: number;
  counts: { paid: number; unpaid: number; verifying: number };
  byDescription: { description: string; total: number; count: number }[];
}

interface StudentStats {
  total: number;
  active: number;
  byGender: { gender: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recent: { name: string; email: string; status: string; enrolled: string }[];
}

interface ExamStats {
  totalResults: number;
  passCount: number;
  passRate: number | string;
  recentPools: { name: string; course: string; date: string; seats: number; capacity: number }[];
}

interface AttendanceStats {
  rate: number | string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

type ReportData = FinanceStats & StudentStats & ExamStats & AttendanceStats;

export default function ReportsClient() {
  const [activeTab, setActiveTab] = useState('finance');
  const [data, setData] = useState<Partial<ReportData> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/reports?type=${type}`);
      const result = await res.json();
      setData(result);
    } catch { toast.error("Failed to load report"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReport(activeTab); }, [activeTab, fetchReport]);

  const handleExport = () => {
    // Create a printable version of the current report
    const printContent = document.getElementById('report-content');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Aerojet Academy - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #0F2A4A; margin-bottom: 8px; }
        h2 { color: #444; font-size: 18px; margin-top: 24px; }
        .stat { display: inline-block; margin: 12px 24px 12px 0; }
        .stat-value { font-size: 28px; font-weight: bold; color: #0F2A4A; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
      </style></head><body>
      <h1>Aerojet Academy</h1>
      <p style="color:#666;margin-bottom:24px;">${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report — Generated ${new Date().toLocaleDateString()}</p>
      ${printContent.innerHTML}
      <div class="footer">Generated from Aerojet Academy Staff Portal on ${new Date().toLocaleString()}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const StatCard = ({ label, value, icon: Icon, color = 'text-primary' }: { label: string; value: string | number; icon: LucideIcon; color?: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-100"><Icon className="w-5 h-5 text-gray-600" /></div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button variant="outline" onClick={handleExport} disabled={loading} className="gap-2">
          <Download className="w-4 h-4" /> Export / Print
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="finance" className="gap-2"><DollarSign className="w-4 h-4" /> Finance</TabsTrigger>
          <TabsTrigger value="students" className="gap-2"><Users className="w-4 h-4" /> Students</TabsTrigger>
          <TabsTrigger value="exams" className="gap-2"><GraduationCap className="w-4 h-4" /> Exams</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2"><ClipboardCheck className="w-4 h-4" /> Attendance</TabsTrigger>
        </TabsList>

        <div id="report-content">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* FINANCE TAB */}
              <TabsContent value="finance" className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Revenue" value={`GHS ${Number(data?.totalRevenue || 0).toLocaleString()}`} icon={TrendingUp} color="text-green-600" />
                  <StatCard label="Outstanding Amount" value={`GHS ${Number(data?.outstandingAmount || 0).toLocaleString()}`} icon={TrendingDown} color="text-red-500" />
                  <StatCard label="Payments Processed" value={data?.counts?.paid || 0} icon={DollarSign} />
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Payment Status Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: 'Paid', count: data?.counts?.paid || 0, color: 'bg-green-500' },
                        { label: 'Verifying', count: data?.counts?.verifying || 0, color: 'bg-amber-500' },
                        { label: 'Unpaid', count: data?.counts?.unpaid || 0, color: 'bg-red-500' },
                      ].map(item => {
                        const total = (data?.counts?.paid || 0) + (data?.counts?.verifying || 0) + (data?.counts?.unpaid || 0);
                        const pct = total > 0 ? ((item.count / total) * 100) : 0;
                        return (
                          <div key={item.label} className="flex items-center gap-4">
                            <span className="text-sm font-medium w-20">{item.label}</span>
                            <div className="flex-1"><Progress value={pct} className={`h-3 [&>div]:${item.color}`} /></div>
                            <span className="text-sm font-bold w-12 text-right">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {(data?.byDescription?.length || 0) > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Revenue by Category</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Payments</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.byDescription?.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell><Badge variant="secondary">{item.count}</Badge></TableCell>
                              <TableCell className="text-right font-bold">GHS {Number(item.total).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* STUDENTS TAB */}
              <TabsContent value="students" className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Students" value={data?.total || 0} icon={Users} />
                  <StatCard label="Active Students" value={data?.active || 0} icon={Users} color="text-green-600" />
                  <StatCard label="Inactive" value={(data?.total || 0) - (data?.active || 0)} icon={Users} color="text-red-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">By Gender</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(data?.byGender || []).map((g) => (
                          <div key={g.gender} className="flex justify-between items-center">
                            <span className="text-sm">{g.gender || 'Unknown'}</span>
                            <Badge variant="outline">{g.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">By Status</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(data?.byStatus || []).map((s) => (
                          <div key={s.status} className="flex justify-between items-center">
                            <span className="text-sm">{s.status || 'Unknown'}</span>
                            <Badge variant="secondary">{s.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* EXAMS TAB */}
              <TabsContent value="exams" className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Exam Results" value={data?.totalResults || 0} icon={GraduationCap} />
                  <StatCard label="Pass Count" value={data?.passCount || 0} icon={TrendingUp} color="text-green-600" />
                  <StatCard label="Pass Rate" value={`${data?.passRate || 0}%`} icon={BarChart3} />
                </div>

                {(data?.recentPools?.length || 0) > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Recent Exam Pools</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pool</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Seats</TableHead>
                            <TableHead>Capacity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.recentPools?.map((pool, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{pool.name}</TableCell>
                              <TableCell>{pool.course || '—'}</TableCell>
                              <TableCell>{new Date(pool.date).toLocaleDateString()}</TableCell>
                              <TableCell><Badge variant="secondary">{pool.seats}</Badge></TableCell>
                              <TableCell>{pool.capacity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ATTENDANCE TAB */}
              <TabsContent value="attendance" className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard label="Overall Rate" value={`${data?.rate || 0}%`} icon={ClipboardCheck} color="text-green-600" />
                  <StatCard label="Present" value={data?.present || 0} icon={TrendingUp} color="text-green-600" />
                  <StatCard label="Absent" value={data?.absent || 0} icon={TrendingDown} color="text-red-500" />
                  <StatCard label="Late" value={data?.late || 0} icon={BarChart3} color="text-amber-500" />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance Distribution (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'Present', value: data?.present || 0, color: 'bg-green-500' },
                        { label: 'Absent', value: data?.absent || 0, color: 'bg-red-500' },
                        { label: 'Late', value: data?.late || 0, color: 'bg-amber-500' },
                      ].map(item => {
                        const total = data?.total || 1;
                        const pct = ((item.value / total) * 100);
                        return (
                          <div key={item.label} className="flex items-center gap-4">
                            <span className="text-sm font-medium w-20">{item.label}</span>
                            <div className="flex-1"><Progress value={pct} className={`h-3 [&>div]:${item.color}`} /></div>
                            <span className="text-sm font-bold w-24 text-right">{item.value} ({pct.toFixed(1)}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
