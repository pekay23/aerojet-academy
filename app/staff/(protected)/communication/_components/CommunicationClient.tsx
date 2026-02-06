"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Users, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function CommunicationClient() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  
  // Message State
  const [targetType, setTargetType] = useState('ALL_STUDENTS'); // ALL_STUDENTS, ALL_STAFF, COURSE_STUDENTS
  const [targetId, setTargetId] = useState(''); // If COURSE_STUDENTS, which course?
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load courses for the dropdown
    fetch('/api/staff/courses').then(res => res.json()).then(data => setCourses(data.courses || []));
  }, []);

  // Effect: Calculate potential recipients when target changes
  useEffect(() => {
    const checkRecipients = async () => {
      setRecipientCount(null);
      try {
        const query = new URLSearchParams({ type: targetType, id: targetId });
        const res = await fetch(`/api/staff/communication/count?${query}`);
        const data = await res.json();
        setRecipientCount(data.count);
      } catch { setRecipientCount(0); }
    };
    
    if (targetType === 'COURSE_STUDENTS' && !targetId) return;
    checkRecipients();
  }, [targetType, targetId]);

  const handleSend = async () => {
    if (!subject || !message) {
      toast.error("Please add a subject and message.");
      return;
    }
    if (recipientCount === 0) {
        toast.error("No recipients found for this selection.");
        return;
    }

    if (!confirm(`Are you sure you want to email ${recipientCount} people?`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/staff/communication/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, subject, message })
      });

      if (res.ok) {
        toast.success(`Message sent to ${recipientCount} recipients!`);
        setSubject('');
        setMessage('');
      } else {
        toast.error("Failed to send message.");
      }
    } catch { toast.error("Transmission error."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      
      {/* LEFT: Composer */}
      <Card className="lg:col-span-2 border-none shadow-lg">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-aerojet-sky" /> Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Target Audience</label>
                <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL_STUDENTS">All Active Students</SelectItem>
                        <SelectItem value="ALL_INSTRUCTORS">All Instructors</SelectItem>
                        <SelectItem value="ALL_STAFF">All Staff & Admins</SelectItem>
                        <SelectItem value="COURSE_STUDENTS">Students in a specific Course</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {targetType === 'COURSE_STUDENTS' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                    <label className="text-sm font-medium text-slate-700">Select Course</label>
                    <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger><SelectValue placeholder="Choose course..." /></SelectTrigger>
                        <SelectContent>
                            {courses.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.code} - {c.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Subject Line</label>
            <Input 
                placeholder="e.g. Important: Exam Schedule Update" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Message Body</label>
            <Textarea 
                placeholder="Type your announcement here..." 
                className="min-h-62.5 text-base leading-relaxed"
                value={message}
                onChange={e => setMessage(e.target.value)}
            />
            <p className="text-xs text-slate-400 text-right">Supports basic plain text. Emails will be wrapped in the official template.</p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSend} disabled={loading || recipientCount === 0} className="bg-aerojet-blue hover:bg-aerojet-sky px-8">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="w-4 h-4 mr-2" />}
                Send Broadcast
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* RIGHT: Audience Overview */}
      <div className="space-y-6">
        <Card className="bg-slate-900 text-white border-none shadow-xl">
            <CardHeader><CardTitle className="text-blue-100">Recipient Summary</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-aerojet-sky" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Total Recipients</p>
                        <div className="text-3xl font-black">
                            {recipientCount === null ? <Loader2 className="w-6 h-6 animate-spin"/> : recipientCount}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Group:</span>
                        <span className="font-bold text-white">{targetType.replace('_', ' ')}</span>
                    </div>
                    {targetType === 'COURSE_STUDENTS' && (
                        <div className="flex justify-between">
                            <span className="text-slate-400">Course ID:</span>
                            <span className="font-mono text-xs">{targetId ? targetId.slice(0,8)+'...' : 'None'}</span>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-start gap-2 text-xs text-orange-300 bg-orange-500/10 p-3 rounded border border-orange-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Emails are sent immediately via the high-priority channel. This action cannot be undone.</p>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
