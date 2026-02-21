"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Instructor {
    id: string;
    name: string;
}

interface Course {
    id: string;
    code: string;
    title: string;
    price: number;
    duration?: string;
    description?: string;
    materialLink?: string;
    instructors?: Instructor[];
}

export default function CourseManagerClient() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ code: '', title: '', price: '', duration: '', description: '' });
    const [editForm, setEditForm] = useState({ title: '', price: '', materialLink: '' });
    const [saving, setSaving] = useState(false);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/courses');
            const data = await res.json();
            setCourses(data.courses || []);
            setInstructors(data.instructors || []);
        } catch { toast.error("Failed to load courses"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleCreate = async () => {
        if (!form.code || !form.title || !form.price) {
            toast.error("Code, title and price are required");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/staff/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Course created!");
            setShowAdd(false);
            setForm({ code: '', title: '', price: '', duration: '', description: '' });
            fetchCourses();
        } catch (err) { toast.error(err instanceof Error ? err.message : "Creation failed"); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (id: string) => {
        setSaving(true);
        try {
            await fetch('/api/staff/courses', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editForm })
            });
            toast.success("Course updated!");
            setEditId(null);
            fetchCourses();
        } catch { toast.error("Update failed"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this course? This cannot be undone.")) return;
        try {
            await fetch('/api/staff/courses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            toast.success("Course deleted");
            fetchCourses();
        } catch { toast.error("Delete failed — may have dependent data"); }
    };

    const startEdit = (course: Course) => {
        setEditId(course.id);
        setEditForm({
            title: course.title,
            price: String(course.price),
            materialLink: course.materialLink || ''
        });
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Course Management</h1>
                <Button onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> New Course</>}
                </Button>
            </div>

            {/* Add Course Form */}
            {showAdd && (
                <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
                    <CardHeader><CardTitle className="text-lg">Create New Course</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Course Code *</label>
                                <Input placeholder="e.g. M1, B1.1" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Price (EUR) *</label>
                                <Input type="number" placeholder="300" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <Input placeholder="e.g. Mathematics" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Duration</label>
                            <Input placeholder="e.g. 6 months, Exam Only" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea placeholder="Course description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Create Course
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Courses Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Existing Courses</CardTitle>
                    <p className="text-sm text-muted-foreground">{courses.length} course{courses.length !== 1 ? 's' : ''} registered</p>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Instructors</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No courses created yet. Click &quot;New Course&quot; to add one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                courses.map(course => (
                                    <TableRow key={course.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono font-bold">{course.code}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {editId === course.id ? (
                                                <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="h-8" />
                                            ) : (
                                                <span className="font-medium">{course.title}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editId === course.id ? (
                                                <Input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="h-8 w-24" />
                                            ) : (
                                                <span className="font-bold">€{Number(course.price).toFixed(2)}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{course.duration || '—'}</TableCell>
                                        <TableCell>
                                            {course.instructors && course.instructors.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {course.instructors.map((i) => (
                                                        <Badge key={i.id} variant="secondary" className="text-xs">{i.name}</Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">None assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {editId === course.id ? (
                                                <div className="flex gap-1 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                                                    <Button size="sm" onClick={() => handleUpdate(course.id)} disabled={saving}>
                                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 justify-end">
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(course)}>
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(course.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
