"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceVerificationPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/staff/finance/pending');
      const data = await res.json();
      setFees(data.fees || []);
      setLoading(false);
    } catch {
      toast.error("Failed to load finance data");
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const handleApprove = async (feeId: string) => {
    try {
      const res = await fetch(`/api/staff/finance/approve`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ feeId })
      });
      if (res.ok) {
        toast.success("Payment Verified! Student unlocked.");
        fetchFees(); // Refresh
      } else {
        toast.error("Approval failed");
      }
    } catch { toast.error("Error approving payment"); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Registration Fee Verification</h1>
      
      <div className="grid gap-4">
        {fees.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No pending payments found.</Card>
        ) : (
            fees.map((fee) => (
                <Card key={fee.id} className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                            {fee.student.user.name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold">{fee.student.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{fee.description}</p>
                            <Badge variant="outline" className="mt-1">{fee.amount} GHS</Badge>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {fee.proofUrl && (
                            <Button variant="outline" size="sm" onClick={() => window.open(fee.proofUrl, '_blank')}>
                                <Eye className="w-4 h-4 mr-2"/> View Proof
                            </Button>
                        )}
                        <Button 
                            className="bg-green-600 hover:bg-green-700" 
                            onClick={() => handleApprove(fee.id)}
                        >
                            <CheckCircle className="w-4 h-4 mr-2"/> Approve
                        </Button>
                    </div>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
