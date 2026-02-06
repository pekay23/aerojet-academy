"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function StaffCoursesClient() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Shared State for Create & Edit
  const [formData, setFormData] = useState({ code: '', title: '', price: '', duration: '', description: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/courses');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch { toast.error("Failed to load courses."); } 
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ code: '', title: '', price: '', duration: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingId(course.id);
    setFormData({ 
        code: course.code, 
        title: course.title, 
        price: String(course.price), 
        duration: course.duration,
        description: course.description || '' 
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch('/api/staff/courses', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingId ? "Course updated!" : "Course created!");
        setIsModalOpen(false);
        fetchCourses();
      } else {
        toast.error("Operation failed.");
      }
    } catch { toast.error("An error occurred."); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this course?")) return;
    try {
        await fetch('/api/staff/courses', { 
            method: 'DELETE', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id }) 
        });
        toast.success("Course deleted.");
        fetchCourses();
    } catch { toast.error("Delete failed."); }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Course Management</h1>
          <p className="text-slate-500 mt-1">Add, edit, or remove modules from the catalog.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-aerojet-sky hover:bg-aerojet-blue text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Add New Course
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
  {loading ? (
    <div className="col-span-3 text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>
  ) : courses.map(course => (
    /* 
       FIX: 
       - Light mode: bg-white with border
       - Dark mode: bg-card (#2c3e50) with border
    */
    <Card key={course.id} className="bg-white dark:bg-card border-border shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span className="bg-muted text-foreground/70 font-mono text-[10px] font-bold px-2 py-1 rounded border border-border">
            {course.code}
          </span>
          <span className="font-black text-xl text-primary">
            €{course.price.toLocaleString()}
          </span>
        </div>
        
        <h3 className="font-bold text-lg text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
          {course.description || "No description available for this module."}
        </p>
        
        <div className="flex gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" className="flex-1 font-bold text-[10px] uppercase tracking-widest" onClick={() => openEditModal(course)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(course.id)}>
              <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Course' : 'Add New Course'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Code (e.g. M1)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              <Input placeholder="Duration (e.g. 20 Hours)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
            <Input placeholder="Module Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <Input type="number" placeholder="Price (EUR)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <Textarea placeholder="Description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Course'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
