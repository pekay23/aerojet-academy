"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

const MODULES = [
    "M1 - Mathematics", "M2 - Physics", "M3 - Electrical", "M4 - Electronics", 
    "M5 - Digital Tech", "M6 - Materials", "M7 - Maintenance", "M8 - Aerodynamics", 
    "M9 - Human Factors", "M10 - Aviation Leg.", "M11 - Turbine Aero", 
    "M13 - Aircraft Aero", "M15 - Gas Turbine", "M17 - Propeller"
];

export default function ExamPoolsClient() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");

  useEffect(() => {
    fetch('/api/student/exam-pools')
        .then(res => res.json())
        .then(data => { setEvents(data.events || []); setLoading(false); })
        .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (poolId: string) => {
    if (!selectedModule) {
        toast.error("Please select a module first");
        return;
    }
    if (!confirm(`Confirm booking for ${selectedModule}? Cost: 300 Credits`)) return;

    setJoining(poolId);
    try {
        const res = await fetch('/api/student/exam-pools/join', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ poolId, moduleCode: selectedModule.split(" - ")[0] })
        });
        const data = await res.json();
        
        if (res.ok) {
            toast.success("Successfully joined pool!");
            window.location.reload(); 
        } else {
            toast.error(data.error);
        }
    } catch {
        toast.error("Failed to join");
    } finally {
        setJoining(null);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-aerojet-blue" /></div>;

  if (events.length === 0) return <div className="p-8 text-center text-muted-foreground">No active exam events found.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-aerojet-blue">Exam Marketplace</h1>
        <p className="text-muted-foreground">Join a pool to reserve your exam seat.</p>
      </div>

      {events.map(event => (
        <div key={event.id} className="space-y-4">
            <div className="flex items-center gap-4 border-b pb-2">
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Deadline: {new Date(event.paymentDeadline).toLocaleDateString()}
                </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.pools.map((pool: any) => {
                    const isJoined = pool.memberships.length > 0;
                    const filled = pool._count.memberships;
                    const capacity = pool.maxCandidates;
                    
                    return (
                        <Card key={pool.id} className={`border-l-4 ${isJoined ? 'border-l-green-500 bg-green-50/10' : 'border-l-aerojet-blue'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={isJoined ? "default" : "outline"} className={isJoined ? "bg-green-600" : ""}>
                                        {isJoined ? "BOOKED" : pool.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {filled}/{capacity} Seats
                                    </span>
                                </div>
                                <CardTitle className="text-lg mt-2">{pool.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3"/> {new Date(pool.examDate).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <Clock className="w-3 h-3"/> {pool.examStartTime} - {pool.examEndTime}
                                </div>

                                {isJoined ? (
                                    <div className="text-center py-2 bg-green-100 text-green-700 rounded-md font-bold text-sm border border-green-200">
                                        Taking: {pool.memberships[0].moduleCode}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Select onValueChange={setSelectedModule}>
                                            <SelectTrigger><SelectValue placeholder="Select Module" /></SelectTrigger>
                                            <SelectContent>
                                                {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            className="w-full bg-aerojet-blue hover:bg-aerojet-sky" 
                                            disabled={joining === pool.id}
                                            onClick={() => handleJoin(pool.id)}
                                        >
                                            {joining === pool.id ? <Loader2 className="w-4 h-4 animate-spin"/> : "Join Pool (300 Credits)"}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
      ))}
    </div>
  );
}
