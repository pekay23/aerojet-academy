"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Link as LinkIcon, Trash2, Calendar, Users, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdmissionsManagerClient() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newForm, setNewNote] = useState({
    name: '', targetAudience: 'STUDENT', selectionType: 'COURSE',
    startDate: '', endDate: '', notificationEmail: '',
    registrationFee: '350', monthlyFee: '', yearlyFee: ''
  });

  useEffect(() => { fetchForms(); }, []);

  const fetchForms = async () => {
    const res = await fetch('/api/staff/admissions/forms');
    const data = await res.json();
    setForms(data.forms || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/staff/admissions/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm)
      });
      if (res.ok) {
        toast.success("Admission form created!");
        setIsModalOpen(false);
        fetchForms();
      }
    } catch { toast.error("Error creating form."); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-aerojet-blue text-white font-bold uppercase text-[10px] tracking-widest px-6 h-11">
            <Plus className="w-4 h-4 mr-2"/> Create Admission Form
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? <div className="text-center py-20 animate-pulse text-muted-foreground">Loading Forms...</div> : 
         forms.map(form => (
          <Card key={form.id} className="bg-card border-border shadow-md hover:shadow-lg transition-all group">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-foreground">{form.name}</h3>
                    <Badge variant={form.isActive ? "default" : "secondary"}>{form.isActive ? 'ACTIVE' : 'DRAFT'}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {form.targetAudience}s</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(form.startDate).toLocaleDateString()} - {new Date(form.endDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Wallet className="w-3 h-3"/> Reg: GHS {form.registrationFee}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="font-bold text-[10px]" onClick={() => {
                    navigator.clipboard.writeText(`https://aerojet-academy.com/apply/${form.id}`);
                    toast.success("Public application link copied!");
                }}>
                    <LinkIcon className="w-3.5 h-3.5 mr-2"/> Copy Link
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- CREATE FORM MODAL --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader><DialogTitle>New Admission Window</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-6">
            <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Form Name</label>
                <Input placeholder="e.g. 2027 Main Intake" value={newForm.name} onChange={e => setNewNote({...newForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Audience</label>
                <Select value={newForm.targetAudience} onValueChange={v => setNewNote({...newForm, targetAudience: v})}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STUDENT">Students</SelectItem>
                        <SelectItem value="GUARDIAN">Guardians / Parents</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selection Type</label>
                <Select value={newForm.selectionType} onValueChange={v => setNewNote({...newForm, selectionType: v})}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="COURSE">Individual Courses</SelectItem>
                        <SelectItem value="CLASS">Standard Cohorts/Classes</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Date</label>
                <Input type="date" value={newForm.startDate} onChange={e => setNewNote({...newForm, startDate: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Date</label>
                <Input type="date" value={newForm.endDate} onChange={e => setNewNote({...newForm, endDate: e.target.value})} />
            </div>
            <div className="col-span-2 space-y-2 pt-4 border-t border-border">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary">Financial Configuration</label>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-[9px] text-muted-foreground uppercase">Registration (GHS)</label>
                        <Input type="number" value={newForm.registrationFee} onChange={e => setNewNote({...newForm, registrationFee: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[9px] text-muted-foreground uppercase">Monthly (Optional)</label>
                        <Input type="number" value={newForm.monthlyFee} onChange={e => setNewNote({...newForm, monthlyFee: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[9px] text-muted-foreground uppercase">Yearly (Optional)</label>
                        <Input type="number" value={newForm.yearlyFee} onChange={e => setNewNote({...newForm, yearlyFee: e.target.value})} />
                    </div>
                </div>
            </div>
            <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notification Email</label>
                <Input placeholder="admissions@aerojet-academy.com" value={newForm.notificationEmail} onChange={e => setNewNote({...newForm, notificationEmail: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={isSaving} className="bg-primary hover:bg-aerojet-blue text-white w-full">
                {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : "Launch Admission Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
