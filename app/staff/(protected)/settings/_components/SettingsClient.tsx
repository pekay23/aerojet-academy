"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Mail, 
  Landmark, 
  CalendarDays, 
  Lock, 
  Save, 
  Loader2, 
  Percent, 
  Power
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Form States
  const [emailRecipient, setEmailRecipient] = useState('');
  const [regFee, setRegFee] = useState('350');
  const [depositPercent, setDepositPercent] = useState('40');
  const [activeYear, setActiveYear] = useState('2026-2027');
  const [isAdmissionsOpen, setIsAdmissionsOpen] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  
  // Bank Details
  const [bankName, setBankName] = useState('FNB Bank');
  const [bankAccName, setBankAccName] = useState('Aerojet Foundation');
  const [bankAccNo, setBankAccNo] = useState('1020003980687');

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/staff/settings');
        const data = await res.json();
        
        const findValue = (key: string) => data.settings?.find((s: any) => s.key === key)?.value;
        
        if (findValue('CONTACT_EMAIL_RECIPIENT')) setEmailRecipient(findValue('CONTACT_EMAIL_RECIPIENT'));
        if (findValue('REGISTRATION_FEE')) setRegFee(findValue('REGISTRATION_FEE'));
        if (findValue('TUITION_DEPOSIT_PERCENT')) setDepositPercent(findValue('TUITION_DEPOSIT_PERCENT'));
        if (findValue('ACTIVE_ACADEMIC_YEAR')) setActiveYear(findValue('ACTIVE_ACADEMIC_YEAR'));
        if (findValue('ADMISSIONS_OPEN')) setIsAdmissionsOpen(findValue('ADMISSIONS_OPEN') === 'true');
        if (findValue('MAINTENANCE_MODE')) setIsMaintenanceMode(findValue('MAINTENANCE_MODE') === 'true');
        if (findValue('BANK_NAME')) setBankName(findValue('BANK_NAME'));
        if (findValue('BANK_ACC_NAME')) setBankAccName(findValue('BANK_ACC_NAME'));
        if (findValue('BANK_ACC_NO')) setBankAccNo(findValue('BANK_ACC_NO'));

      } catch (e) {
        toast.error("Failed to sync system settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const saveSetting = async (key: string, value: string, sectionName: string) => {
    setIsSaving(key);
    try {
      const res = await fetch('/api/staff/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      if (res.ok) {
        toast.success(`${sectionName} updated successfully.`);
      } else {
        toast.error("Failed to save changes.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSaving(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-aerojet-sky" />
        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Control Panel...</p>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 1. ACADEMIC LIFECYCLE */}
        <Card className="bg-card border-border shadow-md transition-all">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold">Academic Calendar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Active Year</label>
              <Select value={activeYear} onValueChange={setActiveYear}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-2026">2025/2026</SelectItem>
                  <SelectItem value="2026-2027">2026/2027</SelectItem>
                  <SelectItem value="2027-2028">2027/2028</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Global Admissions</p>
                <p className="text-[10px] text-muted-foreground">Allow new registrations</p>
              </div>
              <Switch checked={isAdmissionsOpen} onCheckedChange={(val) => {
                  setIsAdmissionsOpen(val);
                  saveSetting('ADMISSIONS_OPEN', String(val), 'Admissions Switch');
              }} />
            </div>
            <Button 
                onClick={() => saveSetting('ACTIVE_ACADEMIC_YEAR', activeYear, 'Academic Year')} 
                disabled={isSaving === 'ACTIVE_ACADEMIC_YEAR'} 
                className="w-full bg-primary h-10 font-bold uppercase text-[10px] tracking-widest"
            >
               {isSaving === 'ACTIVE_ACADEMIC_YEAR' ? <Loader2 className="animate-spin w-4 h-4"/> : "Update Academic Rules"}
            </Button>
          </CardContent>
        </Card>

        {/* 2. FINANCIAL DEFAULTS */}
        <Card className="bg-card border-border shadow-md transition-all">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              <Percent className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold">Financial Defaults</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Registration Fee (GHS)</label>
              <Input type="number" value={regFee} onChange={(e) => setRegFee(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Deposit Percentage (%)</label>
              <Input type="number" value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className="bg-background border-border" />
            </div>
            <Button 
                onClick={() => {
                    saveSetting('REGISTRATION_FEE', regFee, 'Fee');
                    saveSetting('TUITION_DEPOSIT_PERCENT', depositPercent, 'Deposit');
                }} 
                disabled={!!isSaving} 
                className="w-full bg-primary h-10 font-bold uppercase text-[10px] tracking-widest"
            >
               Update Fees
            </Button>
          </CardContent>
        </Card>

        {/* 3. COMMUNICATION ROUTING */}
        <Card className="bg-card border-border shadow-md md:col-span-2 transition-all">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold">System Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Main Alerts Recipient</label>
                <Input value={emailRecipient} onChange={(e) => setEmailRecipient(e.target.value)} className="bg-background border-border h-12" />
              </div>
              <Button 
                onClick={() => saveSetting('CONTACT_EMAIL_RECIPIENT', emailRecipient, 'Notification Email')} 
                disabled={isSaving === 'CONTACT_EMAIL_RECIPIENT'} 
                className="bg-primary h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg"
              >
                 {isSaving === 'CONTACT_EMAIL_RECIPIENT' ? <Loader2 className="animate-spin w-4 h-4"/> : "Save Email Config"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 4. BANKING INFORMATION */}
        <Card className="bg-card border-border shadow-md md:col-span-2 transition-all">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              <Landmark className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold">Official Bank Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Bank Name</label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Account Name</label>
                <Input value={bankAccName} onChange={e => setBankAccName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Account No.</label>
                <Input value={bankAccNo} onChange={e => setBankAccNo(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-border">
                <Button 
                    variant="outline" 
                    className="font-bold uppercase text-[10px] tracking-widest px-8 border-primary text-primary hover:bg-primary/5"
                    onClick={() => {
                        saveSetting('BANK_NAME', bankName, 'Bank Name');
                        saveSetting('BANK_ACC_NAME', bankAccName, 'Account Name');
                        saveSetting('BANK_ACC_NO', bankAccNo, 'Account Number');
                    }}
                >
                    Update Payment Instructions
                </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* DANGER ZONE */}
      <div className="pt-8">
        <h3 className="text-destructive font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2 ml-1">
            <Lock className="w-4 h-4"/> Danger Zone
        </h3>
        <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="font-bold text-foreground">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Disable student portal access temporarily.</p>
                </div>
                <Button 
                    variant={isMaintenanceMode ? "default" : "destructive"} 
                    size="sm" 
                    className="font-black uppercase text-[10px] px-6"
                    onClick={() => {
                        const nextState = !isMaintenanceMode;
                        setIsMaintenanceMode(nextState);
                        saveSetting('MAINTENANCE_MODE', String(nextState), 'Maintenance Mode');
                    }}
                >
                    <Power className="w-3 h-3 mr-2" /> 
                    {isMaintenanceMode ? "Deactivate" : "Activate"}
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
