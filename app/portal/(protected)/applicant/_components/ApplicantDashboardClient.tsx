"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ApplicantDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const dashRes = await fetch('/api/portal/dashboard');
        const dashData = await dashRes.json();
        
        // Security Redirect: If actually enrolled, go to main dashboard
        if (dashData.enrollmentStatus === 'ENROLLED') {
            router.replace('/portal/dashboard');
            return;
        }

        setData(dashData);

        if (dashData.cohort?.includes('Exam') || dashData.cohort === 'Modular') {
            const poolsRes = await fetch('/api/pools');
            const poolsData = await poolsRes.json();
            setPools(poolsData.pools || []);
        }
        setLoading(false);
      } catch { setLoading(false); }
    };
    init();
  }, [router]);

  const handlePurchase = async (item: any, type: 'COURSE' | 'EXAM') => {
    try {
        const res = await fetch('/api/portal/finance/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ type, id: item.id, title: item.title || item.name, price: item.price || 490 })
        });
        if (res.ok) {
            toast.success("Invoice generated!");
            router.push('/portal/finance');
        } else {
            toast.error("Failed to generate invoice");
        }
    } catch { toast.error("Error"); }
  };

  if (loading || !data) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-aerojet-sky" /></div>;

  const isExamOnly = data.cohort?.includes('Exam') || data.cohort === 'Modular';

  // --- VIEW 1: EXAM MARKETPLACE ---
  if (isExamOnly) {
    const showPools = pools.length > 0;
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Exam Booking Portal</h1>
                <p className="text-muted-foreground">Select a session or start a new group.</p>
            </div>
            <Button onClick={() => router.push('/portal/exam-pools')} className="bg-aerojet-sky text-white">
                <Plus className="w-4 h-4 mr-2"/> Book New Exam
            </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {showPools ? pools.slice(0, 4).map(pool => (
                <Card key={pool.id} className="border-border bg-card hover:border-aerojet-sky transition-colors cursor-pointer group">
                    <CardHeader className="pb-2">
                        <Badge variant={pool.status === 'NEARLY_FULL' ? 'destructive' : 'secondary'} className="w-fit mb-2">{pool.status.replace('_', ' ')}</Badge>
                        <CardTitle className="text-base">{pool.name}</CardTitle>
                        <CardDescription>{new Date(pool.examDate).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Capacity</span><span className="font-bold">{pool.currentCount}/{pool.maxCandidates}</span>
                            </div>
                            <Progress value={pool.fillPercentage} className="h-1.5" />
                            <Button size="sm" className="w-full mt-2" onClick={() => router.push('/portal/exam-pools')}>Join Pool</Button>
                        </div>
                    </CardContent>
                </Card>
            )) : (
                ['M1 Maths', 'M2 Physics', 'M3 Electrical', 'M7 Practice'].map((module, i) => (
                    <Card key={i} className="border-dashed border-2 border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-center flex flex-col items-center justify-center p-6 h-48" onClick={() => router.push('/portal/exam-pools')}>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary"><Plus className="w-6 h-6" /></div>
                        <h4 className="font-bold text-foreground">{module}</h4>
                    </Card>
                ))
            )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: FULL TIME FINANCIAL ---
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-card border-l-4 border-l-aerojet-sky p-6 rounded-r-xl shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {data.name}!</h1>
        <p className="text-muted-foreground mt-1">Admission Approved. Secure your seat to begin.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-aerojet-sky bg-aerojet-sky/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-aerojet-sky text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">Recommended</div>
          <CardHeader><CardTitle className="text-lg">Seat Deposit</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary mb-4">40%</div>
            <Button className="w-full bg-aerojet-sky text-white" onClick={() => router.push('/portal/finance')}>Pay Deposit</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
