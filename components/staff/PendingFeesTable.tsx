"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, FileText, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Fee {
    id: string;
    amount: number; // or string if Decimal
    description: string;
    status: string;
    proofUrl: string | null;
    createdAt: string;
    student: {
        id: string;
        enrollmentStatus: string;
        user: {
            name: string | null;
            email: string | null;
            image: string | null;
        }
    }
}

export default function PendingFeesTable() {
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/pending-fees');
            const data = await res.json();
            if (data.fees) {
                setFees(data.fees);
            } else {
                toast.error('Failed to load fees');
            }
        } catch (error) {
            toast.error('Error fetching fees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const handleApprove = async (feeId: string) => {
        setProcessingId(feeId);
        try {
            const res = await fetch('/api/finance/approve-fee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feeId })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Fee approved successfully');
                // Remove from list or refresh?
                // Remove local for instant feedback
                setFees(prev => prev.filter(f => f.id !== feeId));
            } else {
                toast.error(data.error || 'Failed to approve');
            }
        } catch (error) {
            toast.error('Error approving fee');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (feeId: string) => {
        const reason = prompt("Enter rejection reason:");
        if (reason === null) return; // Cancelled

        setProcessingId(feeId);
        try {
            const res = await fetch('/api/finance/reject-fee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feeId, reason })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Fee rejected');
                setFees(prev => prev.filter(f => f.id !== feeId));
            } else {
                toast.error(data.error || 'Failed to reject');
            }
        } catch (error) {
            toast.error('Error rejecting fee');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (fees.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 mb-4">No pending fees found.</p>
                <button
                    onClick={fetchFees}
                    className="text-sm text-aerojet-blue hover:underline flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                        <tr>
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
                                <td className="px-6 py-4 text-sm font-bold text-slate-900">€{Number(fee.amount).toFixed(2)}</td>
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
