"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceClient() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/staff/finance/pending'); // Reusing the pending API
      const data = await res.json();
      setFees(data.fees || []);
      setLoading(false);
    } catch { toast.error("Error loading fees"); }
  };

  useEffect(() => { fetchFees(); }, []);

  const handleApprove = async (id: string) => {
    // Call approve API
    await fetch('/api/staff/finance/approve', { method: 'POST', body: JSON.stringify({ feeId: id }) });
    toast.success("Approved");
    fetchFees();
  };

  if(loading) return <Loader2 className="animate-spin w-8 h-8" />;

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Financial Operations</h1>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fees.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No pending payments.</TableCell></TableRow> : (
                            fees.map(f => (
                                <TableRow key={f.id}>
                                    <TableCell>{f.student.user.name}</TableCell>
                                    <TableCell>{f.description}</TableCell>
                                    <TableCell>€{f.amount}</TableCell>
                                    <TableCell><Badge variant="outline">{f.status}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {f.proofUrl && <Button size="sm" variant="ghost" onClick={() => window.open(f.proofUrl)}><Eye className="w-4 h-4"/></Button>}
                                            <Button size="sm" onClick={() => handleApprove(f.id)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-2"/> Approve</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
