"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Calendar, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ExamManagerClient() {
  const [pools, setPools] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newData, setNewData] = useState({
    eventId: "",
    name: "",
    examDate: "",
    startTime: "09:00",
    endTime: "12:00"
  });

  const fetchData = async () => {
    try {
        const res = await fetch('/api/staff/exams');
        const data = await res.json();
        setPools(data.pools || []);
        setEvents(data.events || []);
        setLoading(false);
    } catch { toast.error("Failed to load exams"); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newData.eventId || !newData.name || !newData.examDate) {
        toast.error("Please fill required fields");
        return;
    }
    setCreating(true);
    try {
        const res = await fetch('/api/staff/exams', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newData)
        });
        if (res.ok) {
            toast.success("Exam Pool Created!");
            setIsCreateOpen(false);
            fetchData();
        } else {
            toast.error("Failed to create.");
        }
    } catch { toast.error("Error"); }
    finally { setCreating(false); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exam Pools</h1>
        <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2"/> New Session</Button>
      </div>

      <div className="grid gap-4">
        {pools.map((pool) => (
            <Card key={pool.id}>
                <CardContent className="p-6 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{pool.name}</h3>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {new Date(pool.examDate).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {pool.examStartTime} - {pool.examEndTime}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant={pool.status === 'CONFIRMED' ? 'default' : 'secondary'}>{pool.status}</Badge>
                        <div className="flex items-center gap-1 text-sm font-medium">
                            <Users className="w-4 h-4"/>
                            {pool._count.memberships} / {pool.maxCandidates}
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Schedule Exam Session</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div>
                    <label className="text-sm font-medium">Event Window</label>
                    <Select onValueChange={(v) => setNewData({...newData, eventId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Event..." /></SelectTrigger>
                        <SelectContent>
                            {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Pool Name</label>
                    <Input placeholder="e.g. Morning Session A" onChange={(e) => setNewData({...newData, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" onChange={(e) => setNewData({...newData, examDate: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-sm font-medium">Start Time</label>
                        <Input type="time" defaultValue="09:00" onChange={(e) => setNewData({...newData, startTime: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">End Time</label>
                        <Input type="time" defaultValue="12:00" onChange={(e) => setNewData({...newData, endTime: e.target.value})} />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Schedule"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
