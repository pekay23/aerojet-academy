"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UploadButton } from "@/app/utils/uploadthing"; // Import the real button

type Fee = {
  id: string;
  amount: number;
  paid: number;
  status: string;
  description: string;
  dueDate: string;
};

export default function FinancePage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Upload Modal State
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  async function fetchLedger() {
    try {
      const res = await fetch('/api/portal/finance');
      const data = await res.json();
      setFees(data.fees || []);
      setBalance(data.balance || 0);
    } catch (error) {
      toast.error("Failed to load finance data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLedger();
  }, []);

  // Function to save the Proof URL to the database after successful upload
  const handleUploadComplete = async (res: any[]) => {
    if (!selectedFee || !res?.[0]?.url) return;

    try {
        const fileUrl = res[0].url; // Get the URL from UploadThing

        // Send to our API to link it to the Fee
        const apiRes = await fetch('/api/portal/finance/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                feeId: selectedFee.id,
                proofUrl: fileUrl 
            }),
        });

        if (apiRes.ok) {
            toast.success("Proof uploaded successfully!");
            setSelectedFee(null); // Close modal
            fetchLedger(); // Refresh list
        } else {
            toast.error("Failed to link proof to invoice.");
        }
    } catch (error) {
        toast.error("An error occurred.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Ledger...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-aerojet-blue">Finance & Ledger</h1>
          <p className="text-gray-600 mt-1">Track your invoices, payments, and outstanding balance.</p>
        </div>
        <div className="bg-red-50 px-6 py-4 rounded-xl border border-red-100 text-right">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-700">GHS {balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Table Container - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
          {/* min-w forces scroll on small screens */}
          <table className="w-full text-left text-sm text-gray-600 min-w-600px">
            <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Description</th>
                    <th className="px-6 py-4 whitespace-nowrap">Date Due</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Amount</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Paid</th>
                    <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {fees.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">No transactions found.</td>
                    </tr>
                ) : (
                    fees.map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{fee.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(fee.dueDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right font-mono whitespace-nowrap">GHS {fee.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-mono text-green-600 whitespace-nowrap">{fee.paid > 0 ? `GHS ${fee.paid.toFixed(2)}` : '-'}</td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                    fee.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                    fee.status === 'VERIFYING' ? 'bg-blue-100 text-blue-700' : 
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {fee.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                {fee.status === 'UNPAID' && (
                                    <button 
                                        onClick={() => setSelectedFee(fee)}
                                        className="text-aerojet-sky hover:text-aerojet-blue font-bold text-xs border border-aerojet-sky px-3 py-1 rounded hover:bg-blue-50 transition"
                                    >
                                        Pay / Upload
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {selectedFee && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-xl font-bold text-aerojet-blue mb-2">Upload Proof of Payment</h2>
                <p className="text-sm text-gray-500 mb-6">For: {selectedFee.description} (GHS {selectedFee.amount})</p>
                
                {/* Real Upload Button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                    <UploadButton
                        endpoint="paymentProof"
                        onClientUploadComplete={(res) => {
                            handleUploadComplete(res);
                        }}
                        onUploadError={(error: Error) => {
                            toast.error(`Upload Failed: ${error.message}`);
                        }}
                        appearance={{
                            button: "bg-aerojet-sky text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-aerojet-soft-blue",
                            container: "w-full",
                            allowedContent: "text-xs text-gray-400"
                        }}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setSelectedFee(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold text-sm">Cancel</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
