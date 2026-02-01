"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // In a real app, fetch balance from API. For now, we assume 0 or handle it via local state updates after purchase.

  const handleBuy = async (type: string) => {
    setLoading(true);
    const res = await fetch('/api/portal/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleType: type })
    });
    if (res.ok) {
        toast.success("Invoice created! Go to Finance to pay.");
    } else {
        toast.error("Failed to create invoice.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-aerojet-blue">Exam Wallet</h1>
        
        <div className="bg-aerojet-blue text-white p-8 rounded-xl shadow-lg flex justify-between items-center">
            <div>
                <p className="text-sm opacity-80 uppercase tracking-wider">Available Credits</p>
                <h2 className="text-5xl font-bold mt-2">{balance}</h2>
            </div>
            <div className="text-right">
                <p className="text-sm opacity-80">Use credits to book exams instantly.</p>
            </div>
        </div>

        <h2 className="text-xl font-bold text-slate-700">Purchase Credits</h2>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-aerojet-sky transition cursor-pointer" onClick={() => handleBuy('BUNDLE_2')}>
                <h3 className="font-bold text-lg text-aerojet-blue">2-Exam Bundle</h3>
                <p className="text-gray-500 mt-2">Save on individual bookings.</p>
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-2xl font-bold text-slate-800">€980</span>
                    <button className="bg-aerojet-sky text-white px-4 py-2 rounded font-bold text-sm">Buy Now</button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-aerojet-sky transition cursor-pointer" onClick={() => handleBuy('BUNDLE_4')}>
                <h3 className="font-bold text-lg text-aerojet-blue">4-Exam Bundle</h3>
                <p className="text-gray-500 mt-2">Best value. Includes free resit.</p>
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-2xl font-bold text-slate-800">€1,900</span>
                    <button className="bg-aerojet-sky text-white px-4 py-2 rounded font-bold text-sm">Buy Now</button>
                </div>
            </div>
        </div>
    </div>
  );
}
