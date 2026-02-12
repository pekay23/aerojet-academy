"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Loader2, Eye, UserPlus, MoreHorizontal, Edit, Trash, KeyRound, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import EditUserDialog from './EditUserDialog';
import AddUserDialog from './AddUserDialog';

interface UserListClientProps {
    initialFilter?: 'all' | 'students' | 'staff' | 'trash';
}

export default function UserListClient({ initialFilter = 'all' }: UserListClientProps) {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    const [filter, setFilter] = useState(initialFilter);

    const fetchUsers = async (roleFilter: string) => {
        try {
            setLoading(true);
            let url = '/api/staff/users';
            if (roleFilter === 'trash') {
                url += '?view=trash';
            } else if (roleFilter !== 'all') {
                url += `?role=${roleFilter}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            setUsers(data.users || []);
        } catch {
            toast.error("Failed to load directory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(filter);
    }, [filter]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will archive the user.")) return;
        try {
            const res = await fetch(`/api/staff/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("User archived");
                fetchUsers(filter);
            } else {
                toast.error("Failed to delete");
            }
        } catch { toast.error("Error"); }
    };

    const handleRestore = async (id: string) => {
        try {
            const res = await fetch('/api/staff/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, isDeleted: false })
            });
            if (res.ok) {
                toast.success("User restored");
                fetchUsers(filter);
            } else {
                toast.error("Failed to restore");
            }
        } catch { toast.error("Error"); }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!confirm("This action cannot be undone. Delete permanently?")) return;
        try {
            const res = await fetch(`/api/staff/users?id=${id}&permanent=true`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("User deleted permanently");
                fetchUsers(filter);
            } else {
                toast.error("Failed to delete");
            }
        } catch { toast.error("Error"); }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="all">Directory</TabsTrigger>
                        <TabsTrigger value="staff">Staff & Instructors</TabsTrigger>
                        <TabsTrigger value="trash" className="text-red-600 data-[state=active]:text-red-700">Archived</TabsTrigger>
                    </TabsList>
                    <Button variant="outline" onClick={() => setIsAddUserOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Add New</Button>
                </div>

                <Card>
                    <div className="p-4 border-b">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search within this list..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-3 w-40" /></div></div></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No users found.</TableCell></TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                                            title="Click to view details"
                                            onClick={() => {
                                                if (filter !== 'trash' && user.role === 'STUDENT' && user.studentProfile?.id) {
                                                    router.push(`/staff/students/${user.studentProfile.id}`);
                                                } else if (filter !== 'trash') {
                                                    setEditingUser(user);
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9"><AvatarImage src={user.image} /><AvatarFallback>{user.name?.[0]}</AvatarFallback></Avatar>
                                                    <div><p className="font-medium text-sm">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                            <TableCell><Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{user.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                                            <TableCell><div className="text-xs text-muted-foreground">{user.studentProfile?.cohort || "N/A"}<br />{user.studentProfile?.enrollmentStatus}</div></TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        {filter === 'trash' ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleRestore(user.id)}><RotateCcw className="mr-2 h-4 w-4" /> Restore</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handlePermanentDelete(user.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete Forever</DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem onClick={() => setEditingUser(user)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                                {user.role === 'STUDENT' && user.studentProfile?.id && (
                                                                    <DropdownMenuItem onClick={() => router.push(`/staff/students/${user.studentProfile.id}`)}><Eye className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600"><Trash className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Tabs>

            {editingUser && <EditUserDialog user={editingUser} open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)} onSuccess={() => fetchUsers(filter)} />}
            <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} onSuccess={() => fetchUsers(filter)} />
        </>
    );
}
