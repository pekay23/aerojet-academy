"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';

export default function SupportClient() {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
        const res = await fetch('/api/contact', { // Reusing public contact API
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: msg, type: 'STUDENT_SUPPORT' })
        });
        if (res.ok) { toast.success("Message sent! We'll reply via email."); setMsg(''); }
        else toast.error("Failed to send.");
    } catch { toast.error("Error"); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-aerojet-blue">Student Support</h1>
        <Card>
            <CardHeader><CardTitle>How can we help?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    placeholder="Describe your issue..." 
                    className="min-h-37.5"
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                />
                <Button onClick={handleSend} disabled={sending || !msg} className="w-full bg-aerojet-blue text-white">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Send className="w-4 h-4 mr-2"/> Send Message</>}
                </Button>
            </CardContent>
        </Card>
        <div className="text-center text-sm text-muted-foreground">
            You can also email us directly at <a href="mailto:support@aerojet-academy.com" className="text-blue-600 hover:underline">support@aerojet-academy.com</a>
        </div>
    </div>
  );
}
