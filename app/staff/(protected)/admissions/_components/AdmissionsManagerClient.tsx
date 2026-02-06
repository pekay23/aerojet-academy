"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar'; // Or use simple date inputs
import { Plus, Copy, Link as LinkIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdmissionsManagerClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock Data
  const [forms, setForms] = useState([
    { id: 1, name: "Sept 2026 General Entry", type: "General", target: "Students", start: "2026-06-01", end: "2026-08-30", status: "ACTIVE" },
    { id: 2, name: "Modular Fast-Track", type: "Course-Specific", target: "Professionals", start: "2026-01-01", end: "2026-12-31", status: "CLOSED" }
  ]);

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsModalOpen(true)} className="bg-aerojet-blue">
            <Plus className="w-4 h-4 mr-2"/> Create New Admission Form
        </Button>
      </div>

      <div className="grid gap-6">
        {forms.map(form => (
            <Card key={form.id} className="flex flex-row items-center justify-between p-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{form.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${form.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {form.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {form.type} • Target: {form.target} • {form.start} to {form.end}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(`https://aerojet-academy.com/apply/${form.id}`);
                        toast.success("Public link copied!");
                    }}>
                        <LinkIcon className="w-4 h-4 mr-2"/> Copy Link
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                </div>
            </Card>
        ))}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Admission Window</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                    <label className="text-sm font-medium">Form Name</label>
                    <Input placeholder="e.g. 2027 Early Access" />
                </div>
                <div>
                    <label className="text-sm font-medium">Target Audience</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="students">Students</SelectItem>
                            <SelectItem value="guardians">Guardians/Parents</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Selection Type</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="class">Class / Cohort</SelectItem>
                            <SelectItem value="course">Specific Course</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" />
                </div>
                <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input type="date" />
                </div>
                <div className="col-span-2">
                    <label className="text-sm font-medium">Notification Receiver Email</label>
                    <Input placeholder="admissions@aerojet.com" />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => { toast.success("Form Created"); setIsModalOpen(false); }}>Create Form</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
