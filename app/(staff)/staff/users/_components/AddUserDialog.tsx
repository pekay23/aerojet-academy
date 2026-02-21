"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
    const [role, setRole] = useState('STUDENT');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/staff/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("User created successfully");
                onSuccess();
                onOpenChange(false);
                // Reset form
                setName('');
                setEmail('');
                setPassword('');
                setRole('STUDENT');
            } else {
                toast.error(data.error || "Failed to create user");
            }
        } catch {
            toast.error("Network Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Full Name</label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="john@example.com" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Password</label>
                        <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Role</label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                <SelectItem value="STAFF">Staff</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? 'Creating...' : 'Create User'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
