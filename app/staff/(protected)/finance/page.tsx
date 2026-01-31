"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

export default function FinanceStaffPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [viewingProof, setViewingProof] = useState<any | null>(null);

  async function fetchPayments() {
    const res = await fetch('/api/staff/finance');
    const data = await res.json();
    setPayments(data.payments || []);
    setLoading(false);
  }

  useEffect(() => { fetchPayments(); }, []);

  const handleConfirm = async (id: string) => {
    const res = await fetch('/api/staff/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId: id })
    });
    if (res.ok) {
        toast.success("Payment Confirmed");
        setViewingProof(null); // Close modal if open
        fetchPayments();
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
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-center">Proof</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {payments.map(pay => (
                        <tr key={pay.id}>
                            <td className="p-4 font-bold">{pay.student.user.name}</td>
                            <td className="p-4">{pay.description}</td>
                            <td className="p-4 text-right">GHS {pay.amount}</td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => setViewingProof(pay)}
                                    className="text-blue-600 underline hover:text-blue-800 text-xs font-bold"
                                >
                                    View File
                                </button>
                            </td>
                            <td className="p-4 text-right">
                                <button onClick={() => handleConfirm(pay.id)} className="bg-green-600 text-white px-4 py-1 rounded text-xs font-bold hover:bg-green-700">
                                    Confirm
                                </button>
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
            <div className="bg-white rounded-xl overflow-hidden max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Proof of Payment: {viewingProof.student.user.name}</h3>
                    <button onClick={() => setViewingProof(null)} className="text-gray-500 hover:text-red-500 font-bold">✕</button>
                </div>
                
                <div className="p-8 bg-gray-100 flex flex-col items-center justify-center min-h-300px">
                    {/* Placeholder for the actual file */}
                    <div className="bg-white p-4 shadow-sm border rounded mb-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">Simulated Receipt File</p>
                        <div className="w-64 h-80 bg-gray-200 flex items-center justify-center text-gray-400">
                            [Image/PDF Preview]
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">In a live environment, the user's uploaded file would appear here.</p>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={() => setViewingProof(null)} className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded">Cancel</button>
                    <button onClick={() => handleConfirm(viewingProof.id)} className="px-4 py-2 bg-green-600 text-white font-bold text-sm hover:bg-green-700 rounded">
                        Confirm Valid Payment
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
