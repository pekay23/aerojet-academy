"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bell, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportClient() {
  const [message, setMessage] = useState('');

  // Mock Notifications (Replace with API fetch later)
  const notifications = [
    { id: 1, title: "Registration Confirmed", date: "2 hours ago", body: "Your registration fee has been verified. Welcome aboard!", type: "success" },
    { id: 2, title: "Exam Schedule", date: "1 day ago", body: "The draft timetable for Oct/Nov 2026 is now available.", type: "info" }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // Call API to send message to staff inbox
    toast.success("Message sent to Admin support.");
    setMessage('');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      
      {/* Notifications Column */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <Bell className="w-5 h-5 text-aerojet-sky" /> Notifications
        </h3>
        {notifications.map(note => (
          <Card key={note.id} className="border-l-4 border-l-aerojet-sky">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-900">{note.title}</h4>
                <span className="text-xs text-slate-400">{note.date}</span>
              </div>
              <p className="text-sm text-slate-600">{note.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat Column */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <MessageSquare className="w-5 h-5 text-aerojet-sky" /> Direct Support
        </h3>
        <Card className="h-100 flex flex-col">
          <CardContent className="flex-1 p-4 bg-slate-50 overflow-y-auto">
            {/* Chat History Placeholder */}
            <div className="text-center text-slate-400 text-sm mt-10">
              Start a new conversation with the admin team.
            </div>
          </CardContent>
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Textarea 
                placeholder="Type your message..." 
                className="resize-none" 
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <Button className="h-auto bg-aerojet-blue" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
