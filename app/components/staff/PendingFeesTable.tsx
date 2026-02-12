"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';

export default function PendingFeesTable() {
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchFees = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/staff/finance/pending');
            const data = await res.json();
            setFees(data.fees || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load pending fees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const handleApprove = async (feeId: string) => {
        if (processingId === feeId) return;
        if (!confirm('Are you sure you want to approve this payment?')) return;

        const originalFees = [...fees];
        setProcessingId(feeId);
        // Optimistic update
        setFees(prev => prev.filter(f => f.id !== feeId));

        try {
            const res = await fetch('/api/staff/finance/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feeId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Payment approved successfully!');
                // No need to fetchFees as we already updated UI optimistically
            } else {
                toast.error(data.error || 'Failed to approve');
                setFees(originalFees);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error approving payment');
            setFees(originalFees);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (feeId: string) => {
        if (processingId === feeId) return;
        const reason = prompt('Reason for rejection (optional):');

        const originalFees = [...fees];
        setProcessingId(feeId);
        // Optimistic update
        setFees(prev => prev.filter(f => f.id !== feeId));

        try {
            const res = await fetch('/api/staff/finance/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feeId, reason })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Payment rejected');
            } else {
                toast.error(data.error || 'Failed to reject');
                setFees(originalFees);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error rejecting payment');
            setFees(originalFees);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (fees.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500">No pending payments to review.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Proof</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {fees.map((fee) => (
                            <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-aerojet-blue font-bold text-xs uppercase">
                                            {fee.student.user.name ? fee.student.user.name.charAt(0) : 'U'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{fee.student.user.name || 'Unknown User'}</div>
                                            <div className="text-xs text-slate-500">{fee.student.user.email}</div>
                                        </div>
                                    </div>
                                    <div className="mt-1 ml-11">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                                            ${fee.student.enrollmentStatus === 'PROSPECT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {fee.student.enrollmentStatus}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{fee.description}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                    {fee.currency === 'GHS' ? 'GHS' : '€'} {Number(fee.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    {fee.proofUrl ? (
                                        <Link
                                            href={fee.proofUrl}
                                            target="_blank"
                                            className="inline-flex items-center gap-1 text-sm text-aerojet-blue hover:text-aerojet-sky"
                                        >
                                            <FileText className="w-4 h-4" /> View
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">None</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">
                                    {new Date(fee.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleReject(fee.id)}
                                            disabled={processingId === fee.id}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                            title="Reject"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleApprove(fee.id)}
                                            disabled={processingId === fee.id}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50"
                                        >
                                            {processingId === fee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Approve
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
