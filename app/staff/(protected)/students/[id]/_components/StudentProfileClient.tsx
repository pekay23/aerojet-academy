"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"; // FIXED: Added Table Imports
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  Phone, Mail, MapPin, Calendar, FileText, 
  AlertTriangle, Download, Plus, Loader2,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; // FIXED: Added router import

export default function StudentProfileClient({ student }: { student: any }) {
  const router = useRouter(); // FIXED: Initialized router
  const [isActive, setIsActive] = useState(student.user?.isActive);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Notes State
  const [notes, setNotes] = useState(student.notes || []);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'GENERAL' });
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Mock Attendance Data
  const attendanceData = [
    { name: 'Present', value: 85, color: '#22c55e' },
    { name: 'Absent', value: 10, color: '#ef4444' },
    { name: 'Late', value: 5, color: '#f97316' },
  ];

  const handleStatusToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/staff/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentStatus: checked ? 'ENROLLED' : 'ON_LEAVE' })
      });
      if (res.ok) {
        setIsActive(checked);
        toast.success("Student status updated.");
      }
    } catch { toast.error("Update failed."); }
    finally { setIsUpdating(false); }
  };

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) return;
    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/staff/students/${student.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      });
      if (res.ok) {
        const { note } = await res.json();
        setNotes([note, ...notes]);
        setNewNote({ title: '', content: '', type: 'GENERAL' });
        setIsNoteModalOpen(false);
        toast.success("Note added successfully.");
      }
    } catch { toast.error("Failed to save note."); }
    finally { setIsSavingNote(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
      
      {/* --- LEFT SIDEBAR: PROFILE OVERVIEW --- */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="overflow-hidden border-t-4 border-t-aerojet-blue shadow-lg">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="w-32 h-32 border-4 border-slate-100 shadow-sm mb-4">
              <AvatarImage src={student.user?.image} />
              <AvatarFallback className="text-2xl font-bold bg-slate-200 text-slate-500">
                {student.user?.name?.substring(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{student.user?.name}</h2>
            <p className="text-xs font-mono text-primary font-bold mt-1 bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                {student.studentId || "PENDING ID"}
            </p>
            
            <div className="flex items-center gap-3 mt-6 mb-6 p-3 bg-muted/50 rounded-xl w-full justify-center border border-border">
              <span className="text-xs font-black uppercase text-muted-foreground">Active:</span>
              <Switch checked={isActive} onCheckedChange={handleStatusToggle} disabled={isUpdating} />
            </div>

            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Mail className="w-4 h-4 text-aerojet-sky" /></div>
                <span className="truncate">{student.user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Phone className="w-4 h-4 text-aerojet-sky" /></div>
                <span>{student.phone || "No phone recorded"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><MapPin className="w-4 h-4 text-aerojet-sky" /></div>
                <span>{student.city || 'Accra'}, {student.region || 'Ghana'}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border w-full text-left">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Emergency Contact</h4>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.emergencyName || "Not Provided"}</p>
              <p className="text-xs text-slate-500 mt-1">{student.emergencyPhone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- MAIN CONTENT: TABS & DATA --- */}
      <div className="lg:col-span-3 space-y-6">
        
        <div className="grid md:grid-cols-2 gap-6">
           <Card className="border-none shadow-lg">
             <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Attendance Pattern</CardTitle></CardHeader>
             <CardContent className="h-55">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                     {attendanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                   </Pie>
                   <Tooltip />
                   <Legend verticalAlign="bottom" align="center" />
                 </PieChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>

           <Card className="border-none shadow-lg bg-linear-to-br from-primary/5 to-transparent">
             <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Financial Status</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-border">
                   <span className="text-sm font-bold">Total Fees</span>
                   <span className="font-black text-primary">€12,400.00</span>
                </div>
                <div className="flex justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-border">
                   <span className="text-sm font-bold">Outstanding</span>
                   <span className="font-black text-destructive">€4,200.00</span>
                </div>
                <Button variant="outline" className="w-full h-12 font-bold uppercase text-[10px] tracking-widest" onClick={() => router.push('/staff/finance')}>Manage Ledger</Button>
             </CardContent>
           </Card>
        </div>

        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent space-x-8">
            <TabsTrigger value="classes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 font-bold uppercase text-[10px] tracking-widest">Enrollments</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 font-bold uppercase text-[10px] tracking-widest">History & Discipline</TabsTrigger>
            <TabsTrigger value="files" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 font-bold uppercase text-[10px] tracking-widest">Documents</TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="classes" className="animate-in fade-in duration-300">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Course Enrollment</CardTitle>
                    <Button size="sm" className="bg-aerojet-sky"><Plus className="w-4 h-4 mr-2"/> Enroll Student</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {student.applications?.map((app: any) => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-bold">{app.course?.title}</TableCell>
                                    <TableCell><Badge variant="outline">{app.status}</Badge></TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">--</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="animate-in fade-in duration-300 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">Timeline</h3>
                <Button size="sm" variant="outline" onClick={() => setIsNoteModalOpen(true)}>
                    <MessageSquare className="w-4 h-4 mr-2"/> Add New Entry
                </Button>
              </div>
              <div className="space-y-4">
                {notes.map((note: any) => (
                    <div key={note.id} className={`p-5 rounded-2xl border transition-all ${
                        note.type === 'DISCIPLINARY' 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : 'bg-white dark:bg-slate-900 border-border shadow-sm'
                    }`}>
                        <div className="flex justify-between items-start mb-3">
                            <Badge className={note.type === 'DISCIPLINARY' ? 'bg-red-600' : 'bg-primary'}>{note.type}</Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-foreground mb-1">{note.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
                    </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="files" className="animate-in fade-in duration-300">
              <Card>
                <CardHeader><CardTitle>Academic Records</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {student.applications?.filter((a:any) => a.transcriptUrl).map((app: any) => (
                        <div key={app.id} className="flex justify-between items-center p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><FileText className="w-6 h-6 text-blue-600" /></div>
                                <div><p className="font-bold text-sm">Transcripts - {app.course?.code}</p><p className="text-[10px] text-muted-foreground">PDF Document</p></div>
                            </div>
                            <Button size="icon" variant="ghost" asChild><a href={app.transcriptUrl} target="_blank"><Download className="w-4 h-4"/></a></Button>
                        </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* --- ADD NOTE MODAL --- */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Create Timeline Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entry Title</label>
                <Input placeholder="e.g. Disciplinary Warning" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</label>
                <Select value={newNote.type} onValueChange={v => setNewNote({...newNote, type: v})}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GENERAL">General Note</SelectItem>
                        <SelectItem value="ACADEMIC">Academic Feedback</SelectItem>
                        <SelectItem value="DISCIPLINARY">Disciplinary Action</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detail Content</label>
                <Textarea className="min-h-37.5 resize-none" placeholder="Provide full details here..." value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={isSavingNote} className="bg-primary hover:bg-aerojet-blue text-white">
                {isSavingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
