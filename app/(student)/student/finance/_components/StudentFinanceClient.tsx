"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function StudentFinanceClient() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const userEmail = session?.user?.email || '';

  useEffect(() => {
    fetch('/api/portal/finance')
        .then(res => res.json())
        .then(data => { setFees(data.fees || []); setLoading(false); })
        .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-aerojet-blue" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-aerojet-blue">Financial Statements</h1>
      
      <div className="grid gap-4">
        {fees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed">No invoices found.</div>
        ) : (
            fees.map((fee) => (
                <Card key={fee.id} className="flex flex-col md:flex-row justify-between p-6 gap-4 border-l-4 border-l-aerojet-blue">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={fee.status === 'PAID' ? 'default' : 'destructive'} className={fee.status === 'PAID' ? 'bg-green-600' : ''}>
                                {fee.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(fee.dueDate).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{fee.description}</h3>
                        <p className="text-xl font-mono mt-2 font-bold text-aerojet-blue">€ {Number(fee.amount).toFixed(2)}</p>
                    </div>

                    <div className="flex flex-col gap-2 justify-center min-w-37.5">
                        {fee.status === 'UNPAID' && (
                            <Button 
                                variant="outline" 
                                onClick={() => window.open(`/upload-proof?email=${encodeURIComponent(userEmail)}`, '_blank')}
                                className="border-aerojet-blue text-aerojet-blue hover:bg-blue-50"
                            >
                                <UploadCloud className="w-4 h-4 mr-2"/> Upload Proof
                            </Button>
                        )}
                        {fee.status === 'PAID' && (
                            <div className="flex items-center justify-center text-green-600 gap-2 font-bold bg-green-50 py-2 rounded-md border border-green-100">
                                <CheckCircle className="w-5 h-5"/> Verified
                            </div>
                        )}
                    </div>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
