"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define the columns/statuses flow
const STATUSES = ['PENDING', 'REVIEWING', 'INTERVIEW', 'APPROVED'];

export default function AdmissionsBoardClient() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
        const res = await fetch('/api/staff/admissions');
        const data = await res.json();
        setApps(data.applications || []);
        setLoading(false);
    } catch { toast.error("Failed to load"); }
  };

  useEffect(() => { fetchApps(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic Update
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    try {
        await fetch('/api/staff/admissions', {
            method: 'POST',
            body: JSON.stringify({ id, status: newStatus })
        });
        toast.success(`Moved to ${newStatus}`);
    } catch {
        toast.error("Update failed");
        fetchApps(); // Revert
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="h-[calc(100vh-100px)] overflow-x-auto">
      <div className="flex gap-4 min-w-250 h-full">
        {STATUSES.map(status => (
            <div key={status} className="flex-1 min-w-70 flex flex-col bg-slate-50 rounded-xl border border-slate-200">
                {/* Column Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                    <h3 className="font-bold text-sm text-slate-700">{status}</h3>
                    <Badge variant="secondary">{apps.filter(a => a.status === status).length}</Badge>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {apps.filter(a => a.status === status).map(app => (
                        <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={app.student.user.image} />
                                        <AvatarFallback>{app.student.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold leading-none">{app.student.user.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">{app.course.code}</p>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex justify-between items-center pt-2 border-t mt-2">
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(app.appliedAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-1">
                                        {/* Move Back */}
                                        {status !== 'PENDING' && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateStatus(app.id, STATUSES[STATUSES.indexOf(status) - 1])}>
                                                <ArrowLeft className="w-3 h-3" />
                                            </Button>
                                        )}
                                        {/* Reject (Only on first 2 stages) */}
                                        {['PENDING', 'REVIEWING'].includes(status) && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateStatus(app.id, 'REJECTED')}>
                                                <XCircle className="w-3 h-3" />
                                            </Button>
                                        )}
                                        {/* Move Forward */}
                                        {status !== 'APPROVED' && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(app.id, STATUSES[STATUSES.indexOf(status) + 1])}>
                                                <ArrowRight className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
