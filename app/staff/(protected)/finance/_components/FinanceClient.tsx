"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';

type Payment = {
  id: string;
  status: 'VERIFYING' | 'PAID' | 'PARTIAL' | 'UNPAID';
  amount: number;
  description: string;
  proofUrl?: string | null;
  student: {
    user: {
      name: string;
    }
  };
};

export default function FinanceClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState('');

  const fetchPendingPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/staff/finance');
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      toast.error('Could not load payments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleOpenVerifyModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setVerifiedAmount(String(payment.amount)); // Pre-fill with expected amount
  };

  const handleConfirmVerification = async () => {
    if (!selectedPayment || !verifiedAmount) return;
    
    setIsVerifying(true);
    try {
      const res = await fetch('/api/staff/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeId: selectedPayment.id,
          amountPaid: parseFloat(verifiedAmount),
        }),
      });

      if (!res.ok) throw new Error('Verification failed');
      
      toast.success('Payment successfully verified!');
      setSelectedPayment(null);
      setVerifiedAmount('');
      // Refresh the list after verification
      fetchPendingPayments();

    } catch (error) {
      toast.error('An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg">Verification Queue</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-center">Proof</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.student.user.name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{p.description}</TableCell>
                    <TableCell className="font-mono">GHS {p.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {p.proofUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenVerifyModal(p)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No payments are currently pending verification.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="amount" className="text-sm font-medium text-slate-700">
                Amount to Verify (GHS)
              </label>
              <Input
                id="amount"
                type="number"
                value={verifiedAmount}
                onChange={(e) => setVerifiedAmount(e.target.value)}
                className="mt-1 text-lg font-mono"
                placeholder="e.g. 350.00"
              />
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              Confirming this payment will update the student's account status and may trigger wallet credits or enrollment.
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleConfirmVerification} disabled={isVerifying}>
              {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
