"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Loader2, Info, CreditCard, UploadCloud, FileCheck, ArrowRight, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UploadButton } from '@/app/utils/uploadthing';

interface PaymentUser {
    name: string;
    email: string;
}

interface RegistrationFee {
    id: string;
    status: 'PAID' | 'PENDING' | 'UNPAID';
    amount?: number;
}

export default function PaymentPage() {
    const router = useRouter();
    // removed searchParams
    const [loading, setLoading] = useState(true);
    // removed uploading
    const [fee, setFee] = useState<RegistrationFee | null>(null);
    const [user, setUser] = useState<PaymentUser | null>(null);

    // removed feeIdParam

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const dashRes = await fetch('/api/portal/dashboard');
            const dashData = await dashRes.json();
            setUser(dashData);

            // Fetch registration fee
            const feeRes = await fetch('/api/applicant/registration-fee');
            const feeData = await feeRes.json();
            setFee(feeData.fee);
        } catch {
            toast.error("Failed to load payment data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isPaid = fee?.status === 'PAID';
    const isPending = fee?.status === 'PENDING';
    
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Registration Payment</h1>
                    <p className="text-muted-foreground mt-1">Complete your registration to unlock the full applicant portal.</p>
                </div>
                <div className="flex items-center gap-3">
                     {isPaid ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-base py-1 px-4">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Payment Verified
                        </Badge>
                     ) : isPending ? (
                        <Badge className="bg-yellow-600 hover:bg-yellow-700 text-base py-1 px-4">
                            <Clock className="w-4 h-4 mr-2" /> Verification Pending
                        </Badge>
                     ) : (
                         <Badge variant="outline" className="text-base py-1 px-4 border-dashed">
                            <Wallet className="w-4 h-4 mr-2" /> Payment Required
                        </Badge>
                     )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-8 items-start">
                
                {/* COLUMN 1: Payment Instructions & Invoice */}
                <div className="space-y-6">
                    <Card className="border-border/60 shadow-md overflow-hidden relative">
                         <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-8 border-b">
                             <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                                        INVOICE #REG-{user?.name?.substring(0,3).toUpperCase()}-001
                                    </Badge>
                                    <CardTitle className="text-xl">Registration Fee</CardTitle>
                                    <CardDescription>Academic Year 2026/2027</CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                                        GHS 350.00
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Total Amount Due</div>
                                </div>
                             </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                             <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
                                <h4 className="flex items-center gap-2 font-semibold text-foreground mb-4">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    Bank Transfer Details
                                </h4>
                                <div className="grid gap-4 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Bank Name</span>
                                            <span className="font-bold text-base">FNB Bank</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Branch Code</span>
                                            <span className="font-bold text-base">330102</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Account Number</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xl tracking-widest text-primary">1020003980687</span>
                                            <Badge variant="secondary" className="text-[10px] h-5">CHECKING</Badge>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Reference</span>
                                        <span className="font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                                            {user?.email}
                                        </span>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            * Please include your email as the payment reference.
                                        </p>
                                    </div>
                                </div>
                             </div>

                             <div className="text-sm text-muted-foreground flex gap-2 items-start bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <p>Payments can be made via Mobile Money to the bank account above or visiting any FNB branch.</p>
                             </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMN 2: Upload / Status Section */}
                <div className="space-y-6">
                    
                    {/* Upload Card */}
                    <Card className={`border-2 shadow-lg transition-all ${isPaid ? 'border-green-500/20 bg-green-50/10' : 'border-dashed border-primary/20'}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {isPaid ? <FileCheck className="w-5 h-5 text-green-600" /> : <UploadCloud className="w-5 h-5 text-primary" />}
                                {isPaid ? 'Proof of Payment Accepted' : 'Upload Proof of Payment'}
                            </CardTitle>
                            <CardDescription>
                                {isPaid ? 'Your receipt has been verified by our team.' : 'Step 2: Upload a photo or PDF of your transaction receipt.'}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                            {isPaid ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-50 duration-500">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Payment Verified</h3>
                                    <p className="text-green-700 dark:text-green-300 max-w-xs mx-auto mt-2 mb-6">
                                        Thank you! Your registration is complete. You may now proceed to the application form.
                                    </p>
                                    <Button onClick={() => router.push('/applicant/dashboard')} className="bg-green-600 hover:bg-green-700 text-white w-full max-w-xs">
                                        Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                     {/* Upload Area */}
                                     {isPending ? (
                                         <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-900/50 rounded-xl p-8 text-center">
                                            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Clock className="w-6 h-6 animate-pulse" />
                                            </div>
                                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Under Review</h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                We have received your receipt. Verification usually takes less than 24 hours.
                                            </p>
                                         </div>
                                     ) : (
                                        <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors group">
                                            <div className="mb-4">
                                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                                    <UploadCloud className="w-6 h-6" />
                                                </div>
                                            </div>
                                            
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-foreground mb-1">Click to Upload Receipt</h4>
                                                <p className="text-xs text-muted-foreground">Supports JPG, PNG, PDF (Max 5MB)</p>
                                            </div>

                                            <div className="flex justify-center relative z-10">
                                                <UploadButton
                                                    endpoint="paymentProof"
                                                    onClientUploadComplete={async (res) => {
                                                        if (res && res[0]) {
                                                            const url = res[0].url;
                                                            // setUploading(true); // removed
                                                            try {
                                                                const response = await fetch('/api/applicant/upload-payment', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ feeId: fee?.id, proofUrl: url }),
                                                                });
                                                                if (response.ok) {
                                                                    toast.success('Proof of payment uploaded successfully!');
                                                                    fetchData();
                                                                } else {
                                                                    toast.error('Failed to submit proof. Please try again.');
                                                                }
                                                            } catch {
                                                                toast.error('Submission error.');
                                                            } finally {
                                                                // setUploading(false); // removed
                                                            }
                                                        }
                                                    }}
                                                    onUploadError={(error: Error) => {
                                                        toast.error(`ERROR! ${error.message}`);
                                                    }}
                                                    appearance={{
                                                        button: "bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2 rounded-full font-medium transition-colors cursor-pointer w-full max-w-[200px]"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                     )}

                                     <div className="text-center">
                                         <p className="text-xs text-muted-foreground">
                                             Having trouble? <a href="mailto:admissions@aerojet-academy.com" className="text-primary hover:underline">Contact Support</a>
                                         </p>
                                     </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline / Steps */}
                    <div className="relative pl-6 border-l-2 border-muted space-y-6 pt-2">
                         <div className="relative">
                            <span className={`absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${isPaid || isPending ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                <CreditCard className="w-3 h-3" />
                            </span>
                             <h4 className="text-sm font-medium leading-none">Step 1: Make Payment</h4>
                             <p className="text-xs text-muted-foreground mt-1">Transfer the registration fee to the bank account.</p>
                         </div>
                         <div className="relative">
                            <span className={`absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${isPaid || isPending ? (isPaid ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white') : 'bg-muted text-muted-foreground'}`}>
                                <UploadCloud className="w-3 h-3" />
                            </span>
                             <h4 className="text-sm font-medium leading-none">Step 2: Upload Proof</h4>
                             <p className="text-xs text-muted-foreground mt-1">Upload a photo or PDF of your transaction receipt.</p>
                         </div>
                         <div className="relative">
                            <span className={`absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${isPaid ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                <CheckCircle2 className="w-3 h-3" />
                            </span>
                             <h4 className="text-sm font-medium leading-none">Step 3: Verification</h4>
                             <p className="text-xs text-muted-foreground mt-1">Wait for verification and proceed to application.</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
