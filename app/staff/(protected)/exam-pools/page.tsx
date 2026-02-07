"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge'; // Ensure Badge is imported
import { 
  Users, Calendar, CheckCircle, AlertTriangle, 
  Merge, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ExamPool {
  id: string;
  name: string;
  status: string;
  examDate: string;
  joinDeadline: string;
  confirmDeadline: string;
  currentCount: number;
  minCandidates: number;
  maxCandidates: number;
  modules: Array<{
    moduleCode: string;
    moduleName: string;
    demandCount: number;
  }>;
}

export default function StaffPoolManagement() {
  const [pools, setPools] = useState<ExamPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [mergeCandidates, setMergeCandidates] = useState<any[]>([]);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pools/staff/all');
      if (!response.ok) throw new Error('Failed to fetch pools');
      const data = await response.json();
      setPools(data.pools || []);
    } catch (error) {
      toast.error('Failed to load pools');
    } finally {
      setLoading(false);
    }
  };

  const fetchMergeCandidates = async () => {
    try {
      const response = await fetch('/api/pools/merge/eligible');
      if (response.ok) {
        const data = await response.json();
        setMergeCandidates(data.eligiblePairs || []);
      }
    } catch (error) {
      console.error('Error fetching merge candidates:', error);
    }
  };

  useEffect(() => {
    fetchPools();
    fetchMergeCandidates();
  }, []);

  const handleConfirmPool = async (poolId: string) => {
    if (!confirm('Confirm this pool? This will capture reservations.')) return;
    try {
      const response = await fetch(`/api/pools/${poolId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomAssignments: {}, examTimes: {} })
      });
      if (!response.ok) throw new Error('Failed to confirm pool');
      toast.success('Pool confirmed!');
      fetchPools();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm pool');
    }
  };

  const handleFailPool = async (poolId: string) => {
    const reason = prompt('Reason for failing this pool?');
    if (!reason) return;
    try {
      const response = await fetch(`/api/pools/${poolId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed');
      toast.success('Pool marked as failed.');
      fetchPools();
    } catch (error: any) {
      toast.error('Failed to fail pool');
    }
  };

  const handleMergePools = async (sourceId: string, targetId: string) => {
    if (!confirm('Merge these pools?')) return;
    try {
      const response = await fetch('/api/pools/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePoolId: sourceId, targetPoolId: targetId })
      });
      if (!response.ok) throw new Error('Failed');
      toast.success('Pools merged!');
      fetchPools();
      fetchMergeCandidates();
    } catch (error: any) {
      toast.error('Merge failed');
    }
  };

  const activePools = pools.filter(p => ['OPEN', 'NEARLY_FULL'].includes(p.status));
  const pendingPools = pools.filter(p => ['OPEN', 'NEARLY_FULL'].includes(p.status) && p.currentCount >= p.minCandidates);
  const confirmedPools = pools.filter(p => p.status === 'CONFIRMED');
  const completedPools = pools.filter(p => ['COMPLETED', 'FAILED', 'CANCELLED'].includes(p.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pool Management</h1>
        <p className="text-muted-foreground mt-1">Manage exam pools and group bookings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <StatsCard title="Active Pools" value={activePools.length} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
        <StatsCard title="Ready to Confirm" value={pendingPools.length} icon={CheckCircle} color="text-green-500" bg="bg-green-500/10" />
        <StatsCard title="Merge Opps" value={mergeCandidates.length} icon={Merge} color="text-purple-500" bg="bg-purple-500/10" />
        <StatsCard title="Confirmed" value={confirmedPools.length} icon={Calendar} color="text-green-500" bg="bg-green-500/10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active">Active Pools ({activePools.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Confirmation ({pendingPools.length})</TabsTrigger>
          <TabsTrigger value="merge">Merge Candidates ({mergeCandidates.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedPools.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activePools.length === 0 ? <EmptyState message="No active pools" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {activePools.map(pool => <PoolCard key={pool.id} pool={pool} onConfirm={handleConfirmPool} onFail={handleFailPool} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingPools.length === 0 ? <EmptyState message="No pools ready" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingPools.map(pool => <PoolCard key={pool.id} pool={pool} onConfirm={handleConfirmPool} onFail={handleFailPool} showConfirmButton />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="merge" className="space-y-4">
          {mergeCandidates.length === 0 ? <EmptyState message="No merge candidates" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {mergeCandidates.map((pair, idx) => <MergeCandidateCard key={idx} pair={pair} onMerge={handleMergePools} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPools.length === 0 ? <EmptyState message="No completed pools" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedPools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components
function StatsCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-6 flex items-center justify-between">
        <div><p className="text-sm text-muted-foreground">{title}</p><h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3></div>
        <div className={`p-3 rounded-lg ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
      </CardContent>
    </Card>
  );
}

function PoolCard({ pool, onConfirm, onFail, showConfirmButton = false }: any) {
  const fillPercentage = (pool.currentCount / pool.maxCandidates) * 100;
  const meetsMinimum = pool.currentCount >= pool.minCandidates;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">{pool.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Exam: {new Date(pool.examDate).toLocaleDateString()}</p>
        </div>
        <Badge variant={pool.status === 'OPEN' ? 'secondary' : 'default'}>{pool.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{pool.currentCount} / {pool.maxCandidates}</span>
            <span className={meetsMinimum ? 'text-green-500 font-bold' : 'text-yellow-500'}>{meetsMinimum ? 'Minimum Met' : `${pool.minCandidates - pool.currentCount} needed`}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${meetsMinimum ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(fillPercentage, 100)}%` }}></div>
          </div>
        </div>
        
        {/* Modules */}
        <div className="flex flex-wrap gap-2">
          {pool.modules.map((mod: any) => (
            <span key={mod.moduleCode} className="px-2 py-1 bg-muted rounded text-xs font-medium">{mod.moduleCode} ({mod.demandCount})</span>
          ))}
        </div>

        {/* Actions */}
        {(onConfirm || onFail) && (
          <div className="flex gap-2 pt-2 border-t border-border mt-4">
            {showConfirmButton && onConfirm && meetsMinimum && (
              <button onClick={() => onConfirm(pool.id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold">Confirm</button>
            )}
            {onFail && (
              <button onClick={() => onFail(pool.id)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm">Fail</button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MergeCandidateCard({ pair, onMerge }: any) {
  return (
    <Card className="border border-purple-200 dark:border-purple-900 bg-card">
      <CardHeader className="pb-3 flex flex-row items-center gap-2">
        <Merge className="w-5 h-5 text-purple-600" />
        <CardTitle className="text-lg">Merge Opportunity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Source</p>
            <p className="font-bold">{pair.poolA.name}</p>
            <p>{pair.poolA.count} people</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Target</p>
            <p className="font-bold">{pair.poolB.name}</p>
            <p>{pair.poolB.count} people</p>
          </div>
        </div>
        <button onClick={() => onMerge(pair.poolA.id, pair.poolB.id)} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-bold">Merge Pools</button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-12 text-center border border-border bg-card">
      <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </Card>
  );
}
