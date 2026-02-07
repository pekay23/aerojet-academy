"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadDropzone } from '@/app/utils/uploadthing';
import { toast } from 'sonner';
import { Loader2, Plus, UploadCloud, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function StudentFinanceClient() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState<string | null>(null); // ID of fee being paid

  useEffect(() => { fetchFees(); }, []);

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/portal/finance');
      const data = await res.json();
      setFees(data.fees || []);
      setLoading(false);
    } catch { setLoading(false); }
  };

  const generateTuition = async () => {
    if(!confirm("Generate standard tuition invoice for this semester?")) return;
    try {
        const res = await fetch('/api/portal/finance/generate', { method: 'POST' });
        if(res.ok) { toast.success("Invoice generated!"); fetchFees(); }
        else { toast.error("Failed to generate invoice."); }
    } catch { toast.error("Error."); }
  };

  const handleUploadComplete = async (url: string) => {
    if (!uploadOpen) return;
    try {
        // Reuse the public submission logic or a dedicated internal one
        // Here we call a new internal route for safety
        await fetch('/api/portal/finance/upload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ feeId: uploadOpen, proofUrl: url })
        });
        toast.success("Proof uploaded! Pending verification.");
        setUploadOpen(null);
        fetchFees();
    } catch { toast.error("Failed to link proof."); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
                <h3 className="text-3xl font-black text-destructive">
                    GHS {fees.filter(f => f.status !== 'PAID').reduce((acc, curr) => acc + (curr.amount - curr.paid), 0).toFixed(2)}
                </h3>
            </CardContent>
        </Card>
        
        {/* Action Card */}
        <Card className="bg-primary/5 border-primary/20 md:col-span-2 flex items-center justify-between p-6">
            <div>
                <h3 className="font-bold text-foreground">Need to pay Tuition?</h3>
                <p className="text-sm text-muted-foreground">Generate your semester invoice to begin payment.</p>
            </div>
            <Button onClick={generateTuition} className="bg-primary text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2"/> Generate Invoice
            </Button>
        </Card>
      </div>

      {/* Fee List */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow> : 
                     fees.map(fee => (
                        <TableRow key={fee.id}>
                            <TableCell className="font-medium">{fee.description}</TableCell>
                            <TableCell>{new Date(fee.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>GHS {fee.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-green-600">GHS {fee.paid.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={fee.status === 'PAID' ? 'default' : fee.status === 'VERIFYING' ? 'secondary' : 'destructive'}>
                                    {fee.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {fee.status !== 'PAID' && fee.status !== 'VERIFYING' && (
                                    <Button size="sm" variant="outline" onClick={() => setUploadOpen(fee.id)}>
                                        <UploadCloud className="w-4 h-4 mr-2"/> Upload Proof
                                    </Button>
                                )}
                                {fee.status === 'VERIFYING' && <span className="text-xs text-muted-foreground italic">Review Pending</span>}
                            </TableCell>
                        </TableRow>
                    ))}
                    {fees.length === 0 && !loading && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={!!uploadOpen} onOpenChange={() => setUploadOpen(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Upload Payment Receipt</DialogTitle></DialogHeader>
            <div className="py-4">
                <UploadDropzone 
                    endpoint="paymentProof"
                    onClientUploadComplete={(res: any) => { if(res?.[0]) handleUploadComplete(res[0].url); }}
                    // FIX: Wrap toast in a void function
                    onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`); }}
                    appearance={{ button: "bg-primary text-white" }}
                />
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
