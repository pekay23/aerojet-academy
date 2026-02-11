"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Settings, Lock, DollarSign, Building } from 'lucide-react';

// ... (existing code)

  // Safe sync with props

import { toast } from 'sonner';

type Setting = { key: string; value: string };

const FINANCE_ITEMS = [
  { key: 'EXAM_PRICE', label: 'Default Exam Price (EUR)', placeholder: '300', type: 'number' as const },
  { key: 'REGISTRATION_FEE', label: 'Registration Fee (GHS)', placeholder: '350', type: 'number' as const },
];

const BANK_ITEMS = [
  { key: 'BANK_NAME', label: 'Bank Name', placeholder: 'FNB Bank', type: 'text' as const },
  { key: 'BANK_ACCOUNT', label: 'Account Number', placeholder: '1020003980687', type: 'text' as const },
  { key: 'BANK_BRANCH', label: 'Branch Code', placeholder: '330102', type: 'text' as const },
];

const ACADEMY_ITEMS = [
  { key: 'ACADEMY_NAME', label: 'Academy Name', placeholder: 'Aerojet Academy', type: 'text' as const },
  { key: 'CONTACT_EMAIL', label: 'Contact Email', placeholder: 'info@aerojet-academy.com', type: 'email' as const },
  { key: 'CONTACT_PHONE', label: 'Contact Phone', placeholder: '+233 XX XXX XXXX', type: 'tel' as const },
];

export default function SettingsClient() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Password state
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/settings');
      const data = await res.json();
      setSettings(data.settings || []);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const getValue = useCallback((key: string) => settings.find(s => s.key === key)?.value || '', [settings]);

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await fetch('/api/staff/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      toast.success(`${key} updated!`);
      // Update local state directly to avoid re-fetch if possible, or just re-fetch
      setSettings(prev => {
        const existing = prev.find(p => p.key === key);
        if (existing) return prev.map(p => p.key === key ? { ...p, value } : p);
        return [...prev, { key, value }];
      });
    } catch { toast.error("Save failed"); }
    finally { setSaving(null); }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirm) {
      toast.error("Fill in all password fields");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });
      if (!res.ok) throw new Error('Failed');
      toast.success("Password changed successfully!");
      setPasswordForm({ current: '', newPassword: '', confirm: '' });
    } catch { toast.error("Password change failed"); }
    finally { setChangingPassword(false); }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <Badge variant="outline" className="text-xs">Admin Only</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Change Password */}
        <Card className="md:col-span-2 border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5" /> Change Your Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={passwordForm.current}
                  onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handlePasswordChange} disabled={changingPassword} className="gap-2">
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <SettingCard
          icon={DollarSign}
          title="Financial Settings"
          items={FINANCE_ITEMS}
          getValue={getValue}
          onSave={saveSetting}
          saving={saving}
        />

        {/* Bank Details */}
        <SettingCard
          icon={Building}
          title="Bank Details"
          items={BANK_ITEMS}
          getValue={getValue}
          onSave={saveSetting}
          saving={saving}
        />

        {/* Academy Info */}
        <SettingCard
          icon={Settings}
          title="Academy Information"
          items={ACADEMY_ITEMS}
          getValue={getValue}
          onSave={saveSetting}
          saving={saving}
        />

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" /> Email Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmailSignatureSetting value={getValue('EMAIL_SIGNATURE')} onSave={(v: string) => saveSetting('EMAIL_SIGNATURE', v)} saving={saving === 'EMAIL_SIGNATURE'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingCard({ icon: Icon, title, items, getValue, onSave, saving }: {
  icon: React.ElementType; title: string;
  items: { key: string; label: string; placeholder: string; type: 'text' | 'number' | 'email' | 'tel' }[];
  getValue: (key: string) => string;
  onSave: (k: string, v: string) => void;
  saving: string | null;
}) {
  // Initialize state lazily
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    items.forEach(item => { initial[item.key] = getValue(item.key); });
    return initial;
  });

  // Safe sync with props
  useEffect(() => {
     // eslint-disable-next-line
     setValues(prev => {
        const next: Record<string, string> = { ...prev };
        let hasChanges = false;
        items.forEach(item => {
            const currentProp = getValue(item.key);
             // Only update if we don't have a local override? Or always sync?
             // If we always sync, typing might be overwritten by slow prop updates.
             // But prop updates only happen on Save.
             // So here we just want to ensure if parent updates from elsewhere, we reflect it.
             if (currentProp !== undefined && currentProp !== prev[item.key] && saving !== item.key) {
                 next[item.key] = currentProp;
                 hasChanges = true;
             }
        });
        return hasChanges ? next : prev;
     });
  }, [getValue, items, saving]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(item => (
          <div key={item.key} className="grid gap-2">
            <label htmlFor={item.key} className="text-sm font-medium">{item.label}</label>
            <div className="flex gap-2">
              <Input
                id={item.key}
                type={item.type}
                placeholder={item.placeholder}
                value={values[item.key] || ''}
                onChange={(e) => setValues(prev => ({ ...prev, [item.key]: e.target.value }))}
              />
              <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSave(item.key, values[item.key] || '')}
                  disabled={saving === item.key || values[item.key] === getValue(item.key)}
                  className="shrink-0"
                >
                  {saving === item.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmailSignatureSetting({ value, onSave, saving }: { value: string; onSave: (v: string) => void; saving: boolean }) {
  const [text, setText] = useState(value);

  useEffect(() => { setText(value); }, [value]);

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Enter email signature..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
      />
      <Button size="sm" onClick={() => onSave(text)} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
        Save Signature
      </Button>
    </div>
  );
}
