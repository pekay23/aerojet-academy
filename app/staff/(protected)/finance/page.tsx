"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function FinanceStaffPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [viewingProof, setViewingProof] = useState<any | null>(null);
  const [confirmAmount, setConfirmAmount] = useState(""); // New State

  async function fetchPayments() {
    const res = await fetch('/api/staff/finance');
    const data = await res.json();
    setPayments(data.payments || []);
    setLoading(false);
  }

  useEffect(() => { fetchPayments(); }, []);

  const handleConfirm = async () => {
    if (!viewingProof || !confirmAmount) return;
    
    const res = await fetch('/api/staff/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId: viewingProof.id, amountPaid: parseFloat(confirmAmount) })
    });
    
    if (res.ok) {
        toast.success(`Payment of €${confirmAmount} Confirmed`);
        setViewingProof(null); 
        setConfirmAmount("");
        fetchPayments();
    } else {
        toast.error("Failed to confirm payment");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Payment Verification</h1>
      
      {payments.length === 0 ? (
        <div className="p-8 bg-white rounded shadow text-gray-500">No pending payments to verify.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-center">Proof</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {payments.map(pay => (
                        <tr key={pay.id}>
                            <td className="p-4 font-bold">{pay.student.user.name}</td>
                            <td className="p-4">{pay.description}</td>
                            <td className="p-4 text-right">€{pay.amount.toFixed(2)}</td>
                            <td className="p-4 text-center">
                                {pay.proofUrl ? (
                                    <button 
                                        onClick={() => setViewingProof(pay)}
                                        className="text-blue-600 underline hover:text-blue-800 text-xs font-bold"
                                    >
                                        Verify
                                    </button>
                                ) : (
                                    <span className="text-gray-400 text-xs">No File</span>
                                )}
                            </td>
                            <td className="p-4 text-right text-gray-400 italic text-xs">
                                Verify to Action
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {viewingProof && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingProof(null)}>
            <div className="bg-white rounded-xl overflow-hidden max-w-4xl w-full h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800">Verify Payment: {viewingProof.student.user.name}</h3>
                    <button onClick={() => setViewingProof(null)} className="text-gray-500 hover:text-red-500 font-bold px-2">✕</button>
                </div>
                
                <div className="flex-1 bg-gray-100 p-4 overflow-auto flex items-center justify-center relative">
                    {viewingProof.proofUrl.endsWith('.pdf') ? (
                        <iframe src={viewingProof.proofUrl} className="w-full h-full rounded border border-gray-300" />
                    ) : (
                        <img src={viewingProof.proofUrl} alt="Proof" className="object-contain max-w-full max-h-full mx-auto" />
                    )}
                </div>

                <div className="p-6 border-t bg-white flex flex-col gap-4 shrink-0">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <p>Total Invoice: <span className="font-bold text-slate-800">€{viewingProof.amount.toFixed(2)}</span></p>
                        <Link href={viewingProof.proofUrl} target="_blank" className="text-blue-600 hover:underline">Open File ↗</Link>
                    </div>
                    
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount Received (EUR)</label>
                            <input 
                                type="number" 
                                value={confirmAmount}
                                onChange={e => setConfirmAmount(e.target.value)}
                                className="w-full border-2 border-slate-300 rounded-lg p-2 text-lg font-mono font-bold focus:border-green-500 outline-none"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        <button 
                            onClick={handleConfirm} 
                            disabled={!confirmAmount}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-md transition-all"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
