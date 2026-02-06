"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Users, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";


export default function CommunicationClient() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  
  const [targetType, setTargetType] = useState('ALL_STUDENTS');
  const [targetId, setTargetId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/staff/courses').then(res => res.json()).then(data => setCourses(data.courses || []));
  }, []);

  useEffect(() => {
    const checkRecipients = async () => {
      setRecipientCount(null);
      try {
        const query = new URLSearchParams({ type: targetType, id: targetId });
        const res = await fetch(`/api/staff/communication?${query}`); // Updated endpoint path
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
    if (!confirm(`Are you sure you want to email ${recipientCount} people?`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/staff/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, subject, message })
      });

      if (res.ok) {
        toast.success(`Message sent successfully!`);
        setSubject('');
        setMessage('');
      } else {
        toast.error("Failed to send message.");
      }
    } catch { toast.error("Transmission error."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* LEFT: Composer - Clean dark/light mapping */}
      <Card className="lg:col-span-2 border border-border bg-card shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Send className="w-5 h-5 text-aerojet-sky" /> Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Audience</label>
                <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL_STUDENTS">All Active Students</SelectItem>
                        <SelectItem value="ALL_INSTRUCTORS">All Instructors</SelectItem>
                        <SelectItem value="ALL_STAFF">All Staff & Admins</SelectItem>
                        <SelectItem value="COURSE_STUDENTS">Students in a specific Course</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {targetType === 'COURSE_STUDENTS' && (
                <div className="space-y-2 animate-in slide-in-from-left-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Course</label>
                    <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Choose course..." />
                        </SelectTrigger>
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
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject Line</label>
            <Input 
                placeholder="e.g. Important: Exam Schedule Update" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="bg-background border-border font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message Body</label>
            <Textarea 
                placeholder="Type your announcement here..." 
                className="min-h-75 bg-background border-border text-base leading-relaxed resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground text-right italic">Emails will be wrapped in the official Aerojet template.</p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSend} disabled={loading || recipientCount === 0} className="bg-primary hover:bg-aerojet-blue px-8 font-bold uppercase tracking-widest text-xs h-12 shadow-md">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="w-4 h-4 mr-2" />}
                Send Broadcast
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* RIGHT: Recipient Info */}
      <div className="space-y-6">
        <Card className="bg-card dark:bg-card border border-border shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Recipients</p>
                        <div className="text-4xl font-black text-foreground tracking-tighter">
                            {recipientCount === null ? "..." : recipientCount}
                        </div>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl border border-border">
                        <span className="text-xs text-muted-foreground font-medium">Targeting:</span>
                        <Badge variant="outline" className="font-bold border-primary/30 text-primary">{targetType.replace('_', ' ')}</Badge>
                    </div>
                </div>

                <div className="mt-8 flex items-start gap-3 text-xs text-orange-600 dark:text-orange-400 bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="leading-relaxed">This message will be delivered instantly to all active email addresses in the selected group.</p>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
