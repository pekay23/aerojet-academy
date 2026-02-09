"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ProfileClient() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setData] = useState({ phone: '', password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/student/profile').then(res=>res.json()).then(data => {
        setStudent(data.student);
        setData(prev => ({ ...prev, phone: data.student.phone || '' }));
        setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
        const res = await fetch('/api/student/profile', {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        if (res.ok) { toast.success("Profile Updated"); setData(prev => ({...prev, password: ''})); }
        else toast.error("Failed to update");
    } catch { toast.error("Error"); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader2 className="animate-spin w-8 h-8 mx-auto mt-10 text-aerojet-blue" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={student.user.image} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">{student.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl font-bold">{student.user.name}</h1>
                <p className="text-muted-foreground">{student.user.email}</p>
                <div className="mt-2 text-xs font-mono bg-slate-100 px-2 py-1 rounded inline-block">ID: {student.studentId || "PENDING"}</div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div>
                <label className="text-sm font-medium mb-1 block">Phone Number</label>
                <Input value={formData.phone} onChange={e => setData({...formData, phone: e.target.value})} />
            </div>
            <div>
                <label className="text-sm font-medium mb-1 block">New Password (Optional)</label>
                <Input type="password" placeholder="Leave blank to keep current" value={formData.password} onChange={e => setData({...formData, password: e.target.value})} />
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-aerojet-blue text-white">
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
