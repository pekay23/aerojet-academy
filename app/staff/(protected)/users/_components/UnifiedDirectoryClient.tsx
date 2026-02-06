"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, User, GraduationCap, PenSquare, Trash2, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function UnifiedDirectoryClient() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => { fetchDirectory(); }, []);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      // We reuse the existing users API but will filter client-side for speed
      const res = await fetch('/api/staff/users'); 
      const data = await res.json();
      setUsers(data.users || []);
    } catch { toast.error("Failed to load directory."); } 
    finally { setLoading(false); }
  };

  // Filter Logic
  const filteredList = users.filter(u => {
    // 1. Tab Filter
    const isStudent = u.role === 'STUDENT';
    if (activeTab === 'students' && !isStudent) return false;
    if (activeTab === 'staff' && isStudent) return false;

    // 2. Search Filter
    const search = searchTerm.toLowerCase();
    return u.name?.toLowerCase().includes(search) || 
           u.email?.toLowerCase().includes(search) ||
           u.studentProfile?.studentId?.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search by name, email, or ID..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="bg-aerojet-blue" onClick={() => router.push('/staff/users/new')}>
            <Plus className="w-4 h-4 mr-2"/> Add New Member
        </Button>
      </div>

      <Tabs defaultValue="students" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100 rounded-lg mb-4">
          <TabsTrigger value="students" className="px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Students
          </TabsTrigger>
          <TabsTrigger value="staff" className="px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Instructors & Staff
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>{activeTab === 'students' ? 'Student ID' : 'Staff ID'}</TableHead>
                  <TableHead>Role/Cohort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                ) : filteredList.length > 0 ? (
                  filteredList.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                      if(activeTab === 'students') router.push(`/staff/students/${user.studentProfile?.id || '#'}`);
                  }}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border border-slate-200">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 text-xs">
                        {activeTab === 'students' 
                            ? (user.studentProfile?.studentId || 'PENDING') 
                            : (user.id.substring(0,8).toUpperCase())} 
                    </TableCell>
                    <TableCell>
                        {activeTab === 'students' ? (
                            <span className="text-xs font-medium text-slate-600">{user.studentProfile?.cohort || 'General'}</span>
                        ) : (
                            <Badge variant="outline" className={user.role === 'ADMIN' ? 'text-red-600 border-red-200 bg-red-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>
                                {user.role}
                            </Badge>
                        )}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">ACTIVE</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">INACTIVE</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-aerojet-blue">
                        <PenSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))) : (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">No records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
