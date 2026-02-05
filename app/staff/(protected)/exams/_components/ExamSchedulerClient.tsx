"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';

export default function ExamSchedulerClient() {
  const [runs, setRuns] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [moduleId, setModuleId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Runs, Modules, and Rooms in parallel
      const res = await fetch('/api/staff/exams'); 
      const data = await res.json();
      setRuns(data.runs || []);
      setModules(data.modules || []);
      setRooms(data.rooms || []);
    } catch {
      toast.error("Failed to load exam data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!moduleId || !roomId || !date || !time) {
      toast.error("Please fill all fields.");
      return;
    }

    const datetime = new Date(`${date}T${time}`);

    try {
      const res = await fetch('/api/staff/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          moduleId, 
          roomId, 
          datetime: datetime.toISOString(),
          duration 
        })
      });

      if (res.ok) {
        toast.success("Exam session scheduled!");
        setIsModalOpen(false);
        fetchData(); // Refresh list
      } else {
        toast.error("Failed to schedule exam.");
      }
    } catch { toast.error("Error creating exam."); }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)} className="bg-aerojet-blue hover:bg-aerojet-sky">
          <Plus className="w-4 h-4 mr-2" /> Schedule New Session
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-bold text-slate-800">{run.course.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(run.startDatetime).toLocaleDateString()} 
                      <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        {new Date(run.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {run.room.name}
                    </div>
                  </TableCell>
                  <TableCell>{run.durationMinutes} mins</TableCell>
                  <TableCell className="text-right font-mono">
                    {run.bookings.length} / {run.maxCapacity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule New Exam</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <Select onValueChange={setModuleId}>
                <SelectTrigger><SelectValue placeholder="Select Module" /></SelectTrigger>
                <SelectContent>
                  {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.code} - {m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input type="time" onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <Select onValueChange={setRoomId}>
                <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                <SelectContent>
                  {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (Minutes)</label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>

          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>Schedule Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
