"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, Clock, XCircle, FileText, Loader2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [fee, setFee] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

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
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image (JPG, PNG) or PDF file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('feeId', fee.id);

            const res = await fetch('/api/applicant/upload-payment', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Proof of payment uploaded successfully! Awaiting staff review.');
                fetchData(); // Refresh data
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch (error) {
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const getStatusBadge = () => {
        switch (fee?.status) {
            case 'PAID':
                return <Badge className="bg-green-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
            case 'UNPAID':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Unpaid</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const isPaid = fee?.status === 'PAID';
    const isPending = fee?.status === 'PENDING';
    const isUnpaid = fee?.status === 'UNPAID';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Registration Payment</h1>
                <p className="text-muted-foreground">Complete your registration fee to access the full applicant portal</p>
            </div>

            {/* Status Alert */}
            {isPaid && (
                <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-green-900 dark:text-green-100 mb-1">Payment Approved!</h3>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Your registration fee has been verified. You can now proceed with your application.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isPending && (
                <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-1">Payment Under Review</h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    Our team is reviewing your proof of payment. You'll receive an email once approved (usually within 24 hours).
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Invoice Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Registration Fee Invoice</CardTitle>
                            <CardDescription>Non-refundable application processing fee</CardDescription>
                        </div>
                        {getStatusBadge()}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Amount */}
                    <div className="flex items-baseline justify-between p-4 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Amount Due:</span>
                        <span className="text-3xl font-black text-foreground">GHS 350.00</span>
                    </div>

                    {/* Payment Instructions */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Bank Transfer Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Bank Name</span>
                                <span className="font-semibold">FNB Bank</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Account Number</span>
                                <span className="font-semibold font-mono">1020003980687</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Branch Code</span>
                                <span className="font-semibold">330102</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Reference</span>
                                <span className="font-semibold text-xs">{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    {!isPaid && (
                        <>
                            <hr className="border-border" />
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-1">Upload Proof of Payment</h4>
                                    <p className="text-sm text-muted-foreground">
                                        After making your payment, upload a clear image or PDF of your receipt/transaction confirmation.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <div className="border-2 border-dashed border-border hover:border-primary transition-colors rounded-lg p-8 text-center">
                                            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                            <div className="text-sm">
                                                <span className="font-semibold text-primary">Click to upload</span>
                                                <span className="text-muted-foreground"> or drag and drop</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG or PDF (max. 5MB)
                                            </p>
                                        </div>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/jpg,application/pdf"
                                            onChange={handleFileUpload}
                                            disabled={uploading || isPending}
                                        />
                                    </label>

                                    {uploading && (
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </div>
                                    )}

                                    {isPending && (
                                        <p className="text-sm text-center text-muted-foreground">
                                            <FileText className="w-4 h-4 inline mr-1" />
                                            Proof of payment submitted and awaiting review
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Action Button */}
                    {isPaid && (
                        <Button onClick={() => router.push('/applicant/dashboard')} className="w-full" size="lg">
                            Continue to Dashboard
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Need Help?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                        If you experience any issues with payment or upload, please contact our admissions team.
                    </p>
                    <div className="flex gap-4 text-sm">
                        <a href="mailto:admissions@aerojet-academy.com" className="text-primary hover:underline font-medium">
                            admissions@aerojet-academy.com
                        </a>
                        <a href="tel:+233551010108" className="text-primary hover:underline font-medium">
                            +233 551 010 108
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
