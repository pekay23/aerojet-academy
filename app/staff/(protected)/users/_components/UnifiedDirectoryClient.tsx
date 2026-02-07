"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2, PenSquare, Trash2, Undo2, Plus, Archive } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function UnifiedDirectoryClient() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("students");
  const [showTrash, setShowTrash] = useState(false);

  // EDIT MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'STUDENT', 
    isActive: 'true', 
    image: '' 
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchDirectory(); }, [showTrash]);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const endpoint = showTrash ? '/api/staff/users?view=trash' : '/api/staff/users';
      const res = await fetch(endpoint); 
      const data = await res.json();
      setUsers(data.users || []);
    } catch { toast.error("Failed to load directory."); } 
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'STUDENT', isActive: 'true', image: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setEditingUser(user);
    setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Password not shown for security
        role: user.role,
        isActive: user.isActive ? 'true' : 'false',
        image: user.image || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("Are you sure you want to archive this user?")) return;
    try {
        const res = await fetch(`/api/staff/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success("User archived."); fetchDirectory(); }
    } catch { toast.error("Delete failed."); }
  };

  const handlePermanentDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("⚠️ PERMANENTLY DELETE? This cannot be undone.")) return;
    try {
        const res = await fetch(`/api/staff/users?id=${id}&permanent=true`, { method: 'DELETE' });
        if (res.ok) { toast.success("Permanently deleted."); fetchDirectory(); }
    } catch { toast.error("Delete failed."); }
  };

  const handleRestore = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
        const res = await fetch('/api/staff/users', {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: id, isDeleted: false, isActive: true })
        });
        if (res.ok) { toast.success("User restored!"); fetchDirectory(); }
    } catch { toast.error("Restore failed."); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const method = editingUser ? 'PATCH' : 'POST';
      
      // If creating, use provided password or default '123'
      const payload = editingUser 
        ? { userId: editingUser.id, ...formData, isActive: formData.isActive === 'true' }
        : { ...formData, isActive: formData.isActive === 'true', password: formData.password || '123' };

      const res = await fetch('/api/staff/users', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingUser ? "Updated!" : "Created!");
        setIsModalOpen(false);
        fetchDirectory();
      } else { 
        const err = await res.json();
        toast.error(err.error || "Operation failed."); 
      }
    } catch { toast.error("An error occurred."); }
    finally { setIsSaving(false); }
  };

  const filteredList = users.filter(u => {
    const isStudent = u.role === 'STUDENT';
    const search = searchTerm.toLowerCase();
    const matchesSearch = u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search);
    if (activeTab === 'students') return isStudent && matchesSearch;
    return !isStudent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search by name, email..." 
            className="pl-9 bg-background border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            <Button variant={showTrash ? "destructive" : "outline"} onClick={() => setShowTrash(!showTrash)}>
                {showTrash ? <><Undo2 className="w-4 h-4 mr-2"/> Active List</> : <><Archive className="w-4 h-4 mr-2"/> View Archive</>}
            </Button>
            {!showTrash && (
                <Button className="bg-aerojet-sky hover:bg-aerojet-blue text-white" onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2"/> Add User
                </Button>
            )}
        </div>
      </div>

      <Tabs defaultValue="students" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl border border-border mb-6">
          <TabsTrigger value="students" className="px-8 py-2.5 rounded-lg transition-all data-[state=active]:bg-aerojet-sky data-[state=active]:text-white text-muted-foreground font-bold">Students</TabsTrigger>
          <TabsTrigger value="staff" className="px-8 py-2.5 rounded-lg transition-all data-[state=active]:bg-aerojet-sky data-[state=active]:text-white text-muted-foreground font-bold">Instructors & Staff</TabsTrigger>
        </TabsList>

        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest p-4">Profile</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">{activeTab === 'students' ? 'Student ID' : 'Staff ID'}</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right p-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-aerojet-sky"/></TableCell></TableRow>
              ) : filteredList.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="group hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => { if(activeTab === 'students' && !showTrash) router.push(`/staff/students/${user.id}`); }}
                >
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-border">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="bg-muted text-foreground font-bold">{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                          <div className="font-bold text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                      {activeTab === 'students' ? (user.studentProfile?.studentId || 'PENDING') : user.id.substring(0,8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}>
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-4">
                    <div className="flex justify-end gap-1">
                        {showTrash ? (
                            <>
                                <Button variant="outline" size="sm" className="h-8 text-green-600" onClick={(e) => handleRestore(e, user.id)}><Undo2 className="w-4 h-4"/></Button>
                                <Button variant="destructive" size="sm" className="h-8" onClick={(e) => handlePermanentDelete(e, user.id)}><Trash2 className="w-4 h-4"/></Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="group-hover:text-aerojet-sky" onClick={(e) => handleEditClick(e, user)}>
                                    <PenSquare className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(e, user.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Tabs>

      {/* EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? 'Edit Member' : 'Add New Member'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            {/* EMAIL FIELD (Added Back) */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <Input 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    disabled={!!editingUser} // Disabled on edit to prevent ID conflicts
                />
            </div>

            {/* PASSWORD FIELD (Only for New Users) */}
            {!editingUser && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                    <Input 
                        type="password"
                        placeholder="Default: 123" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                    />
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Profile Image URL</label>
                <Input placeholder="https://..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                    <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                    <Select value={formData.isActive} onValueChange={v => setFormData({...formData, isActive: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
