"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpRight, History, Loader2, CreditCard, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function WalletClient() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch('/api/student/wallet')
        .then(res => res.json())
        .then(data => { setWallet(data.wallet); setLoading(false); })
        .catch(() => setLoading(false));
  }, []);

  const handleTopUp = async () => {
    if (!topUpAmount || isNaN(Number(topUpAmount))) return;
    setProcessing(true);
    try {
        const res = await fetch('/api/student/wallet/top-up', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ amount: parseFloat(topUpAmount) })
        });
        if (res.ok) {
            toast.success("Invoice generated! Please check Finance tab to upload proof.");
            setTopUpAmount('');
        } else {
            toast.error("Failed to generate invoice");
        }
    } catch {
        toast.error("Network error");
    } finally {
        setProcessing(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-aerojet-blue" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        {/* BALANCE CARD */}
        <Card className="bg-aerojet-blue text-white border-none shadow-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-blue-200 text-sm uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="w-4 h-4"/> Available Balance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-5xl font-bold mb-2">€ {Number(wallet?.availableBalance || 0).toFixed(2)}</div>
                <div className="text-sm text-blue-200">
                    Reserved: € {Number(wallet?.reservedBalance || 0).toFixed(2)}
                </div>
            </CardContent>
        </Card>

        {/* TOP UP CARD */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5"/> Top Up Wallet</CardTitle></CardHeader>
            <CardContent>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-500">€</span>
                        <Input 
                            type="number" 
                            placeholder="Amount" 
                            className="pl-8" 
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleTopUp} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                        {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : "Generate Invoice"}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    Generates a payment invoice. Once you pay and upload proof in the <strong>Finance</strong> tab, your wallet will be credited.
                </p>
            </CardContent>
        </Card>
      </div>

      {/* TRANSACTIONS */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="w-5 h-5"/> Transaction History</CardTitle></CardHeader>
        <CardContent>
            {wallet?.transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No transactions yet.</div>
            ) : (
                <div className="space-y-4">
                    {wallet?.transactions.map((tx: any) => (
                        <div key={tx.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${tx.type === 'RESERVE' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                    {tx.type === 'RESERVE' ? <Clock className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4"/>}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{tx.description}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className={`font-bold ${tx.type === 'RESERVE' ? 'text-orange-600' : 'text-green-600'}`}>
                                {tx.type === 'RESERVE' ? '-' : '+'} €{Number(tx.amount).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
