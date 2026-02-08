"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function UserListClient() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch students specifically
        const res = await fetch('/api/staff/users?role=students');
        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        toast.error("Failed to load directory");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter logic
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) || 
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <Card>
      <div className="p-4 border-b flex gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search students..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <Button variant="outline" className="ml-auto">
            <UserPlus className="w-4 h-4 mr-2" /> Add New
        </Button>
      </div>

      <CardContent className="p-0">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredUsers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => {
                            if (user.studentProfile?.studentId) {
                                // Link to the Student Profile we created (Using Student ID, not User ID if possible, or mapping it)
                                // Note: The API returns studentProfile object. We need the ID from the student table, usually stored in studentProfile.id
                                // Check your API response structure. If studentProfile has ID, use it.
                                // For now, let's assume we link via the Student ID if it exists, or handle it.
                                // EDIT: Your Schema has 'id' on Student. The user list API needs to return studentProfile.id
                                // If the API provided earlier only returns studentId (string code) and cohort, we might need to fetch by User ID or update API.
                                // Let's try navigating.
                            }
                        }}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={user.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                                    {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {user.studentProfile?.cohort || "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={(e) => {
                                    e.stopPropagation();
                                    if (user.studentProfile?.id) {
                                        router.push(`/staff-new/students/${user.studentProfile.id}`);
                                    } else {
                                        toast.error("No student profile found for this user");
                                    }
                                }}>
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
