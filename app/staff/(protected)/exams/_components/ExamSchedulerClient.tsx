"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';

export default function ExamSchedulerClient() {
  const [runs, setRuns] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    moduleId: '', roomId: '', date: '', time: '', duration: '60'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/exams'); 
      const data = await res.json();
      setRuns(data.runs || []);
      setModules(data.modules || []);
      setRooms(data.rooms || []);
    } catch { toast.error("Failed to load exam data."); } 
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ moduleId: '', roomId: '', date: '', time: '', duration: '60' });
    setIsModalOpen(true);
  };

  const openEditModal = (run: any) => {
    const dt = new Date(run.startDatetime);
    setEditingId(run.id);
    setFormData({
        moduleId: run.examModuleId || run.course.id, // Fallback
        roomId: run.roomId,
        date: dt.toISOString().split('T')[0],
        time: dt.toTimeString().slice(0,5),
        duration: String(run.durationMinutes)
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.moduleId || !formData.roomId || !formData.date || !formData.time) {
      toast.error("Please fill all fields.");
      return;
    }
    const datetime = new Date(`${formData.date}T${formData.time}`);

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = { 
        id: editingId, // Only used for PATCH
        moduleId: formData.moduleId, 
        roomId: formData.roomId, 
        datetime: datetime.toISOString(),
        duration: formData.duration 
      };

      const res = await fetch('/api/staff/exams', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingId ? "Exam updated!" : "Exam scheduled!");
        setIsModalOpen(false);
        fetchData();
      } else { toast.error("Operation failed."); }
    } catch { toast.error("Error saving exam."); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this exam session? This cannot be undone.")) return;
    try {
        await fetch('/api/staff/exams', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        toast.success("Exam deleted.");
        fetchData();
    } catch { toast.error("Delete failed."); }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreateModal} className="bg-aerojet-blue hover:bg-aerojet-sky">
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow> : 
               runs.map((run) => (
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(run)}>
                            <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(run.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Exam' : 'Schedule Exam'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <Select value={formData.moduleId} onValueChange={(v) => setFormData({...formData, moduleId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Module" /></SelectTrigger>
                <SelectContent>
                  {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.code} - {m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <Select value={formData.roomId} onValueChange={(v) => setFormData({...formData, roomId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                <SelectContent>
                  {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (Minutes)</label>
              <Input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Schedule Session'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
