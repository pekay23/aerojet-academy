"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, Calendar, AlertCircle, Info } from 'lucide-react';

export default function ExamPoolsPage() {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pools?includeJoined=true')
      .then(res => res.json())
      .then(data => {
        setPools(data.pools || []);
        setLoading(false);
      });
  }, []);

  const handleJoin = async (poolId: string) => {
    // In a real app, open a modal to select modules first
    const modules = prompt("Enter module codes (comma separated):", "M1,M2");
    if (!modules) return;
    
    try {
      const res = await fetch(`/api/pools/${poolId}/join`, {
        method: 'POST',
        body: JSON.stringify({ requestedModules: modules.split(',') })
      });
      if (res.ok) {
        toast.success("Joined pool successfully!");
        window.location.reload();
      } else {
        toast.error("Failed to join");
      }
    } catch { toast.error("Error"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exam Pools</h1>
        <p className="text-muted-foreground">Join group sessions to save on exam costs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pools.map(pool => (
          <Card key={pool.id} className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{pool.name}</span>
                <span className="text-sm font-normal text-muted-foreground">{pool.status}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Participants:</span>
                <span className="font-bold">{pool.currentCount} / {pool.minCandidates}</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-aerojet-sky h-full" style={{ width: `${pool.fillPercentage}%` }} />
              </div>
              {pool.isUserJoined ? (
                <Button variant="outline" className="w-full text-green-600 border-green-200 bg-green-50" disabled>
                  Joined
                </Button>
              ) : (
                <Button onClick={() => handleJoin(pool.id)} className="w-full bg-aerojet-sky text-white">
                  Join Pool
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
