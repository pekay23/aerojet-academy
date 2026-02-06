"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // Ensure these are imported
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2, PenSquare, Plus, Trash2, Undo2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function UnifiedDirectoryClient() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("students");

  // EDIT MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', isActive: 'true', image: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchDirectory(); }, []);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/users'); 
      const data = await res.json();
      setUsers(data.users || []);
    } catch { toast.error("Failed to load directory."); } 
    finally { setLoading(false); }
  };

  const handleEditClick = (e: React.MouseEvent, user: any) => {
    e.stopPropagation(); // CRITICAL: Prevents the row click from firing
    setEditingUser(user);
    setFormData({
        name: user.name || '',
        role: user.role,
        isActive: user.isActive ? 'true' : 'false',
        image: user.image || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/staff/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive === 'true',
          image: formData.image
        })
      });

      if (res.ok) {
        toast.success("Member updated!");
        setIsModalOpen(false);
        fetchDirectory();
      } else { toast.error("Update failed."); }
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
      
      {/* ... Header with search and Add button (Keep existing) ... */}
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
        <Button className="bg-aerojet-sky hover:bg-aerojet-blue text-white" onClick={() => router.push('/staff/users')}>
            <Plus className="w-4 h-4 mr-2"/> Add New Member
        </Button>
      </div>

      <Tabs defaultValue="students" onValueChange={setActiveTab} className="w-full">
        {/* ... Tab List (Keep existing styling) ... */}
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
                <TableHead className="text-right p-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-aerojet-sky"/></TableCell></TableRow>
              ) : filteredList.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="group hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => { if(activeTab === 'students') router.push(`/staff/students/${user.id}`); }}
                >
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-border">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="bg-muted text-foreground font-bold">{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                          <div className="font-bold text-foreground">{user.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">{user.role}</div>
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
                    {/* --- FIXED EDIT BUTTON --- */}
                    <Button variant="ghost" size="icon" className="group-hover:text-aerojet-sky" onClick={(e) => handleEditClick(e, user)}>
                        <PenSquare className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Tabs>

      {/* --- EDIT MODAL --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Member Permissions</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
