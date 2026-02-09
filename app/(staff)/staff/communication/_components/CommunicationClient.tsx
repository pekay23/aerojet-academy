"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export default function CommunicationClient() {
  const [form, setForm] = useState({ subject: '', message: '', target: 'ALL_STUDENTS' });
  
  const handleSend = async () => {
    toast.promise(
        fetch('/api/staff/communication', { method: 'POST', body: JSON.stringify(form) }),
        { loading: 'Sending...', success: 'Broadcast Sent!', error: 'Failed' }
    );
  };

  return (
    <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Communication Center</h1>
        <Card>
            <CardHeader><CardTitle>Send Announcement</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Recipient Group</label>
                    <Select onValueChange={v => setForm({...form, target: v})} defaultValue="ALL_STUDENTS">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_STUDENTS">All Active Students</SelectItem>
                            <SelectItem value="APPLICANTS">Pending Applicants</SelectItem>
                            <SelectItem value="STAFF">Staff Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Input placeholder="Subject Line" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
                <Textarea placeholder="Message content..." className="min-h-50" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                <div className="flex justify-end">
                    <Button onClick={handleSend}><Send className="w-4 h-4 mr-2"/> Send Broadcast</Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
