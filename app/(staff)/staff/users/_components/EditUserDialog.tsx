"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function EditUserDialog({ user, open, onOpenChange, onSuccess }: any) {
  const [role, setRole] = useState('STUDENT');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
        setRole(user.role);
        setName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/staff/users', {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: user.id, role, name })
        });
        if (res.ok) {
            toast.success("User updated");
            onSuccess();
            onOpenChange(false);
        } else {
            toast.error("Failed to update");
        }
    } catch { toast.error("Network Error"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit User Details</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} />
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
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
