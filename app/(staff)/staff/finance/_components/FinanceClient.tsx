"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Loader2, XCircle, FileImage, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceClient() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchFees = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/finance/pending');
      const data = await res.json();
      setFees(data.fees || []);
      setLoading(false);
    } catch { toast.error("Error loading fees"); }
  }, []);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const handleApprove = async (id: string) => {
    if (processingIds.has(id)) return;

    const originalFees = [...fees];
    setProcessingIds(prev => new Set(prev).add(id));
    setFees(prev => prev.filter(f => f.id !== id));

    try {
      const res = await fetch('/api/staff/finance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId: id })
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast.success("Approved successfully");
    } catch (err) {
      toast.error("Error approving fee");
      setFees(originalFees);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    if (processingIds.has(id)) return;

    const originalFees = [...fees];
    setProcessingIds(prev => new Set(prev).add(id));
    setFees(prev => prev.filter(f => f.id !== id));

    try {
      const res = await fetch('/api/staff/finance/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId: id })
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("Rejected successfully");
    } catch (err) {
      toast.error("Error rejecting fee");
      setFees(originalFees);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      'UNPAID': { className: 'bg-red-100 text-red-700 border-red-200', label: 'Unpaid' },
      'VERIFYING': { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Proof Submitted' },
      'PARTIAL': { className: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Partial' },
      'PAID': { className: 'bg-green-100 text-green-700 border-green-200', label: 'Paid' },
    };
    const v = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status };
    return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financial Operations</h1>
        <Badge variant="secondary" className="text-sm">{fees.length} pending</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No pending payments.
                  </TableCell>
                </TableRow>
              ) : (
                fees.map(f => (
                  <TableRow key={f.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{f.student?.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{f.student?.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{f.description}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">
                        {f.description?.toLowerCase().includes('registration') ? 'GHS' : '€'} {Number(f.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(f.status)}</TableCell>
                    <TableCell>
                      {f.proofUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => setPreviewUrl(f.proofUrl)}
                        >
                          <FileImage className="w-4 h-4" />
                          View Proof
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No proof</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {f.proofUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => window.open(f.proofUrl, '_blank')}
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        {f.status === 'VERIFYING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(f.id)}
                            disabled={processingIds.has(f.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleApprove(f.id)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={processingIds.has(f.id)}
                        >
                          {processingIds.has(f.id) ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Proof Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Payment Proof</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open(previewUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-1" /> Open Full
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPreviewUrl(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Payment proof"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  // If image fails, show as download link
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="text-center p-8">
                      <p class="text-gray-500 mb-4">Preview not available for this file type</p>
                      <a href="${previewUrl}" target="_blank" class="text-blue-600 underline font-medium">Download File</a>
                    </div>
                  `;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
