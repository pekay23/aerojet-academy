"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Shield, Server, Save, Loader2, Bell } from 'lucide-react';

export default function SettingsClient() {
  const [emailRecipient, setEmailRecipient] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch current settings
    fetch('/api/staff/settings')
      .then(res => res.json())
      .then(data => {
        const contactEmail = data.settings?.find((s: any) => s.key === 'CONTACT_EMAIL_RECIPIENT');
        setEmailRecipient(contactEmail?.value || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSaveEmail = async () => {
    if (!emailRecipient) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/staff/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'CONTACT_EMAIL_RECIPIENT', value: emailRecipient })
      });

      if (res.ok) {
        toast.success("Email configuration updated.");
      } else {
        toast.error("Failed to save changes.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading system settings...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      
      {/* 1. Email & Notifications Configuration */}
      <Card className="bg-card border-border shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
                <CardTitle className="text-lg">Email Configuration</CardTitle>
                <CardDescription>Define where system notifications are delivered.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Enquiry Notifications Recipient</label>
            <div className="flex gap-3">
                <Input 
                    type="email" 
                    placeholder="admissions@aerojet-academy.com" 
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="bg-background border-border flex-1"
                />
                <Button 
                    onClick={handleSaveEmail} 
                    disabled={isSaving}
                    className="bg-aerojet-sky hover:bg-aerojet-blue text-white shadow-sm font-bold uppercase text-[10px] tracking-widest px-6"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4 mr-2"/> Save</>}
                </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
                Website enquiry forms and registration alerts will be sent to this address.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Security & Access (Placeholder for future) */}
      <Card className="bg-card border-border shadow-md overflow-hidden opacity-60 grayscale cursor-not-allowed">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Shield className="w-5 h-5 text-slate-500" />
            </div>
            <div>
                <CardTitle className="text-lg">Authentication Rules</CardTitle>
                <CardDescription>Manage password policies and MFA requirements.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-dashed border-border">
                <span className="text-sm text-muted-foreground font-medium italic">Advanced security controls coming in next update.</span>
            </div>
        </CardContent>
      </Card>

      {/* 3. System Health */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">System Status: All Systems Operational</span>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
      </div>

    </div>
  );
}
