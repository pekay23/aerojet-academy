"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Mail, Phone, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function StudentProfileClient({ id }: { id: string }) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  
  // Cohort State
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  // 1. Fetch Data
  const fetchData = async () => {
      try {
        const [studentRes, cohortRes] = await Promise.all([
            fetch(`/api/staff/students/${id}`),
            fetch('/api/staff/cohorts')
        ]);
        
        const sData = await studentRes.json();
        const cData = await cohortRes.json();
        
        setStudent(sData.student);
        setCohorts(cData.cohorts || []);
      } catch (error) {
        toast.error("Could not load data");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => { fetchData(); }, [id]);

  // 2. Action: Resend Access Code
  const handleResendCode = async () => {
    if (!student) return;
    if (!confirm("Reset password and send new code?")) return;
    
    setResending(true);
    try {
        const res = await fetch(`/api/staff/students/${id}/resend-code`, { method: 'POST' });
        if (res.ok) toast.success("Code sent!");
        else toast.error("Failed.");
    } catch { toast.error("Error"); } 
    finally { setResending(false); }
  };

  // 3. Action: Assign Cohort
  const handleEnroll = async () => {
    if (!selectedCohort) return;
    setEnrolling(true);
    try {
        const res = await fetch(`/api/staff/students/${id}/enroll`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ cohortId: selectedCohort, status: 'ENROLLED' })
        });
        if (res.ok) {
            toast.success("Student Enrolled!");
            setIsEnrollModalOpen(false);
            fetchData(); // Refresh UI
        } else {
            toast.error("Failed to enroll");
        }
    } catch { toast.error("Error"); }
    finally { setEnrolling(false); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!student) return <div className="p-8 text-center">Student not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* HEADER CARD */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            
            <div className="flex gap-4 items-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center border overflow-hidden relative">
                {student.user.image ? (
                    <Image src={student.user.image} alt={student.user.name} fill className="object-cover" />
                ) : (
                    <span className="text-2xl font-bold text-slate-400">{student.user.name?.[0]}</span>
                )}
              </div>
              
              <div>
                <h1 className="text-2xl font-bold">{student.user.name}</h1>
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                    <Mail className="w-4 h-4" /> {student.user.email}
                </div>
                <div className="flex gap-2 mt-3">
                    <Badge variant={student.user.isActive ? "default" : "destructive"}>
                        {student.user.isActive ? "Active" : "Locked"}
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                        {student.cohort || "No Cohort"}
                    </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" onClick={handleResendCode} disabled={resending}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} /> Resend Code
                </Button>
                <Button onClick={() => setIsEnrollModalOpen(true)}>
                    <GraduationCap className="w-4 h-4 mr-2" /> Assign Cohort
                </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-muted-foreground">Phone</label><p>{student.phone || "N/A"}</p></div>
                        <div><label className="text-xs font-bold text-muted-foreground">Joined</label><p>{new Date(student.createdAt).toLocaleDateString()}</p></div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="finance">
            <Card>
                <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
                <CardContent>
                    {student.fees.map((fee: any) => (
                        <div key={fee.id} className="flex justify-between border-b pb-2 mb-2">
                            <span>{fee.description}</span>
                            <Badge>{fee.status}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* ENROLL MODAL */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Assign Cohort</DialogTitle></DialogHeader>
            <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Select Intake/Cohort</label>
                <Select onValueChange={setSelectedCohort}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                        {cohorts.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button onClick={handleEnroll} disabled={enrolling}>{enrolling ? "Saving..." : "Confirm Assignment"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
