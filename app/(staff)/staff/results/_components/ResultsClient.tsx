"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch'; // Ensure you have this or use checkbox

export default function ResultsClient() {
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/staff/results').then(res => res.json()).then(data => {
        setPools(data.pools || []);
        setLoading(false);
    });
  }, []);

  const selectPool = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/staff/results?poolId=${id}`);
    const data = await res.json();
    setSelectedPool(data.pool);
    // Initialize grades state
    const initGrades: any = {};
    data.pool.memberships.forEach((m: any) => {
        initGrades[m.studentId] = { score: '', isPassed: false, moduleCode: m.moduleCode };
    });
    setGrades(initGrades);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = Object.entries(grades).map(([studentId, data]) => ({
        studentId,
        ...data
    }));

    try {
        const res = await fetch('/api/staff/results', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ poolId: selectedPool.id, grades: payload })
        });
        if (res.ok) {
            toast.success("Results Published!");
            setSelectedPool(null);
            // Refresh list
        } else {
            toast.error("Failed");
        }
    } catch { toast.error("Error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (selectedPool) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setSelectedPool(null)}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
                <h1 className="text-2xl font-bold">{selectedPool.name} - Grading</h1>
            </div>

            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 text-left font-medium text-sm text-slate-500">Student</th>
                                <th className="p-4 text-left font-medium text-sm text-slate-500">Module</th>
                                <th className="p-4 text-left font-medium text-sm text-slate-500">Score (%)</th>
                                <th className="p-4 text-left font-medium text-sm text-slate-500">Passed?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedPool.memberships.map((m: any) => (
                                <tr key={m.id} className="border-b last:border-0">
                                    <td className="p-4 font-medium">{m.student.user.name}</td>
                                    <td className="p-4"><Badge variant="outline">{m.moduleCode}</Badge></td>
                                    <td className="p-4">
                                        <Input 
                                            type="number" 
                                            className="w-24" 
                                            value={grades[m.studentId]?.score || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setGrades(prev => ({
                                                    ...prev,
                                                    [m.studentId]: { ...prev[m.studentId], score: val, isPassed: Number(val) >= 75 }
                                                }));
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <Badge className={grades[m.studentId]?.isPassed ? "bg-green-600" : "bg-red-600"}>
                                            {grades[m.studentId]?.isPassed ? "PASS" : "FAIL"}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Publish Results
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pending Grading</h1>
      <div className="grid gap-4">
        {pools.length === 0 ? <p>No completed exams pending grading.</p> : pools.map(pool => (
            <Card key={pool.id} className="cursor-pointer hover:bg-slate-50" onClick={() => selectPool(pool.id)}>
                <CardContent className="p-6 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold">{pool.name}</h3>
                        <p className="text-sm text-muted-foreground">{new Date(pool.examDate).toLocaleDateString()}</p>
                    </div>
                    <Button>Grade</Button>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
