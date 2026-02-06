"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Shield, User, GraduationCap, PenSquare, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'INSTRUCTOR' | 'STUDENT';
  isActive: boolean;
  image?: string;
};

export default function UserManagementClient() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // Only for creation
    role: 'STUDENT',
    isActive: 'true',
    image: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    setFilteredUsers(users.filter(u => 
      u.name?.toLowerCase().includes(lowerTerm) || 
      u.email?.toLowerCase().includes(lowerTerm)
    ));
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/users');
      const data = await res.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch { toast.error("Failed to load users."); } 
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'STUDENT', isActive: 'true', image: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't show password
      role: user.role,
      isActive: user.isActive ? 'true' : 'false',
      image: user.image || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser 
        ? { ...formData, userId: editingUser.id, isActive: formData.isActive === 'true' }
        : { ...formData, isActive: formData.isActive === 'true' };

      const res = await fetch('/api/staff/users', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingUser ? "User updated!" : "User created!");
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Operation failed.");
      }
    } catch { toast.error("An error occurred."); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to PERMANENTLY delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/staff/users?id=${id}`, { method: 'DELETE' }); // Ensure DELETE logic handles query param or body
      if (res.ok) {
        toast.success("User deleted.");
        fetchUsers();
      } else {
        toast.error("Delete failed.");
      }
    } catch { toast.error("Error deleting user."); }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-red-600 hover:bg-red-700">Admin</Badge>;
      case 'STAFF': return <Badge className="bg-purple-600 hover:bg-purple-700">Staff</Badge>;
      case 'INSTRUCTOR': return <Badge className="bg-blue-600 hover:bg-blue-700">Instructor</Badge>;
      default: return <Badge variant="secondary">Student</Badge>;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search users..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchUsers}><RefreshCw className="w-4 h-4"/></Button>
            <Button onClick={openCreateModal} className="bg-aerojet-blue"><Plus className="w-4 h-4 mr-2"/> Add User</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Active</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(user)}>
                        <PenSquare className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editingUser} />
            </div>

            {!editingUser && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium">Profile Photo URL</label>
                <Input placeholder="https://..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
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
                <label className="text-sm font-medium">Status</label>
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
