"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, Shield, GraduationCap, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CommunicationClient() {
  const [target, setTarget] = useState('ALL_STUDENTS');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const groups = [
    { id: 'ALL_STUDENTS', label: 'All Students', icon: Users, color: 'bg-blue-500' },
    { id: 'INSTRUCTORS', label: 'All Instructors', icon: GraduationCap, color: 'bg-purple-500' },
    { id: 'STAFF', label: 'Admin Staff', icon: Shield, color: 'bg-emerald-500' },
  ];

  const handleBroadcast = async () => {
    if (!subject || !message) return toast.error("Please fill all fields.");
    setIsSending(true);
    try {
      const res = await fetch('/api/staff/communication/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, subject, message })
      });
      if (res.ok) {
        toast.success("Broadcast delivered successfully.");
        setSubject(''); setMessage('');
      }
    } catch { toast.error("Broadcast failed."); }
    finally { setIsSending(false); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      
      {/* 1. Group Selector */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Target Group</h3>
        {groups.map(group => {
            const Icon = group.icon;
            const isSelected = target === group.id;
            return (
                <Card 
                    key={group.id} 
                    className={`cursor-pointer transition-all border-2 ${isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent hover:bg-muted/50'}`}
                    onClick={() => setTarget(group.id)}
                >
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-2 rounded-lg text-white ${group.color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">{group.label}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Broadcast Group</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </CardContent>
                </Card>
            )
        })}
      </div>

      {/* 2. Message Composer */}
      <Card className="lg:col-span-2 border-border bg-card shadow-xl overflow-hidden">
        <div className="bg-muted/30 p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest">Broadcast Message</span>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase text-[10px]">
                Target: {target.replace('_', ' ')}
            </Badge>
        </div>
        <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</label>
                <Input placeholder="e.g. 2027 Admission Deadline Extended" value={subject} onChange={e => setSubject(e.target.value)} className="h-12 bg-background" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message Body</label>
                <Textarea 
                    placeholder="Type your official announcement here..." 
                    className="min-h-75 bg-background resize-none text-base leading-relaxed" 
                    value={message} 
                    onChange={e => setMessage(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic text-right">Messages are automatically wrapped in the Aerojet official email header and footer.</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleBroadcast} disabled={isSending} className="bg-primary hover:bg-aerojet-blue h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-lg">
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="w-4 h-4 mr-2"/>}
                    Deliver Broadcast
                </Button>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
