"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Reply } from 'lucide-react';

export default function SupportAdminClient() {
  // Mock Data (Replace with API fetch)
  const messages = [
    { id: 1, student: "Kwame Doe", email: "kwame@test.com", subject: "Exam Conflict", body: "I have two exams scheduled at the same time.", date: "2 hours ago", status: "OPEN" },
    { id: 2, student: "Ama Osei", email: "ama@test.com", subject: "Payment Issue", body: "My payment verified but wallet didn't update.", date: "1 day ago", status: "CLOSED" }
  ];

  return (
    <div className="space-y-4">
      {messages.map(msg => (
        <Card key={msg.id} className="hover:border-aerojet-sky transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{msg.subject}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="w-4 h-4" /> {msg.student} ({msg.email})
                </div>
              </div>
              <Badge variant={msg.status === 'OPEN' ? 'destructive' : 'secondary'}>{msg.status}</Badge>
            </div>
            <p className="text-slate-600 my-4 p-3 bg-slate-50 rounded-lg text-sm">{msg.body}</p>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-2">
                <Reply className="w-4 h-4" /> Reply via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
