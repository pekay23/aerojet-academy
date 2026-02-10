"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmailSignatureSettings from './EmailSignatureSettings';

export default function SettingsClient() {
  const [examPrice, setExamPrice] = useState('300'); // Default
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch('/api/staff/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'EXAM_PRICE', value: examPrice })
      });
      toast.success("Settings Saved");
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <Card>
        <CardHeader><CardTitle>Pricing Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Standard Exam Price (EUR)</label>
            <Input value={examPrice} onChange={e => setExamPrice(e.target.value)} type="number" />
          </div>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Update Settings'}</Button>
        </CardContent>
      </Card>

      <EmailSignatureSettings />
    </div>
  );
}
