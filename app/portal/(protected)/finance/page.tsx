"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UploadButton } from "@/app/utils/uploadthing";

type Fee = {
  id: string;
  amount: number; 
  paid: number;
  status: string;
  description: string;
  dueDate: string;
};

const Icons = {
  Ledger: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Wallet: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
};

export default function FinancePage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  const [isEuro, setIsEuro] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(13.09);
  const [rateLoading, setRateLoading] = useState(false);

  // Inside FinancePage
useEffect(() => {
    async function fetchRate() {
      setRateLoading(true);
      
      const primaryUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json`;
      const fallbackUrl = `https://latest.currency-api.pages.dev/v1/currencies/eur.json`;

      try {
        // Try Primary
        const res = await fetch(primaryUrl);
        if (!res.ok) throw new Error("Primary failed");
        const data = await res.json();
        if (data.eur && data.eur.ghs) {
            setExchangeRate(data.eur.ghs);
            return; // Success, exit
        }
        throw new Error("Primary data invalid");
      } catch (primaryError) {
        console.warn("Primary currency API failed, trying fallback...", primaryError);
        
        try {
            // Try Fallback
            const resBackup = await fetch(fallbackUrl);
            const dataBackup = await resBackup.json();
            if (dataBackup.eur && dataBackup.eur.ghs) {
                setExchangeRate(dataBackup.eur.ghs);
            } else {
                setExchangeRate(17.50); // Hard fallback
            }
        } catch (backupError) {
            console.error("All currency APIs failed.", backupError);
            setExchangeRate(17.50); // Hard fallback
        }
      } finally {
        setRateLoading(false);
      }
    }
    fetchRate();
  }, []);


  const formatCurrency = (amount: number) => {
    if (isEuro) {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    } else {
      return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount * exchangeRate);
    }
  };

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

  useEffect(() => { fetchLedger(); }, []);

  const handleUploadComplete = async (res: any[]) => {
    if (!selectedFee || !res?.[0]?.url) return;
    try {
        const fileUrl = res[0].url;
        const apiRes = await fetch('/api/portal/finance/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feeId: selectedFee.id, proofUrl: fileUrl }),
        });

        if (apiRes.ok) {
            toast.success("Proof uploaded successfully!");
            setSelectedFee(null);
            fetchLedger();
        } else {
            toast.error("Failed to link proof.");
        }
    } catch (error) {
        toast.error("An error occurred.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Ledger...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-aerojet-sky/10 text-aerojet-sky rounded-xl">
            <Icons.Ledger />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-aerojet-blue">Finance & Ledger</h1>
            <p className="text-gray-600 text-sm">
                {rateLoading ? 'Syncing live rates...' : `Live Rate: 1 EUR = ${exchangeRate.toFixed(2)} GHS`}
            </p>
          </div>
        </div>

        <div 
          onClick={() => setIsEuro(!isEuro)}
          className="cursor-pointer bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-right hover:border-aerojet-sky transition-all group min-w-50"
        >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-aerojet-sky">Outstanding Balance ({isEuro ? 'EUR' : 'GHS'})</p>
            <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(balance)}
            </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar lg:no-scrollbar">
          <table className="w-full text-left text-sm text-gray-600 min-w-200">
            <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Paid</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {fees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-slate-800">{fee.description}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700 cursor-pointer" onClick={() => setIsEuro(!isEuro)}>
                            {formatCurrency(fee.amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-green-600">
                            {fee.paid > 0 ? formatCurrency(fee.paid) : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                fee.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                fee.status === 'VERIFYING' ? 'bg-blue-100 text-blue-700' : 
                                'bg-red-50 text-red-600'
                            }`}>
                                {fee.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {fee.status === 'UNPAID' && (
                                <button onClick={() => setSelectedFee(fee)} className="bg-white text-aerojet-sky hover:bg-aerojet-sky hover:text-white font-bold text-[10px] border border-aerojet-sky px-4 py-1.5 rounded-lg transition-all">
                                    Upload Proof
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Real-time Rates powered by FreeCurrencyAPI
          </p>
          <button onClick={() => setIsEuro(!isEuro)} className="text-[10px] font-bold text-aerojet-sky hover:underline uppercase">
            Switch to {isEuro ? 'Ghana Cedis' : 'Euros'}
          </button>
      </div>

      {selectedFee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-aerojet-sky text-white rounded-lg"><Icons.Wallet /></div>
                    <h2 className="text-xl font-bold text-aerojet-blue">Submit Payment Proof</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Please upload your bank transfer receipt for: <br/>
                    <span className="font-bold text-slate-800">{selectedFee.description}</span>
                </p>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50 text-center">
                    <UploadButton
                        endpoint="paymentProof"
                        onClientUploadComplete={(res) => handleUploadComplete(res)}
                        // FIX IS HERE: Wrapped in braces
                        onUploadError={(error: Error) => {
                            toast.error(`Error: ${error.message}`);
                        }}
                        appearance={{
                            button: "bg-aerojet-sky text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-aerojet-navy transition-all shadow-md",
                            allowedContent: "text-[10px] text-gray-400 mt-2"
                        }}
                    />
                </div>
                <div className="mt-6">
                    <button onClick={() => setSelectedFee(null)} className="w-full py-3 text-gray-500 hover:text-slate-800 font-bold text-sm transition-colors">
                        Cancel and Go Back
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
