"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, XCircle, CheckCircle, FileImage, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUSES = ['PENDING', 'REVIEWING', 'INTERVIEW', 'APPROVED'];

export default function AdmissionsBoardClient() {
    const [apps, setApps] = useState<any[]>([]);
    const [prospects, setProspects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('prospects');

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/admissions');
            const data = await res.json();
            setApps(data.applications || []);
            setProspects(data.prospects || []);
            setLoading(false);
        } catch { toast.error("Failed to load"); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const updateStatus = async (id: string, newStatus: string) => {
        setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        try {
            await fetch('/api/staff/admissions', {
                method: 'POST',
                body: JSON.stringify({ id, status: newStatus })
            });
            toast.success(`Moved to ${newStatus}`);
        } catch {
            toast.error("Update failed");
            fetchData();
        }
    };

    const handleApproveFee = async (feeId: string) => {
        try {
            await fetch('/api/staff/finance/approve', {
                method: 'POST',
                body: JSON.stringify({ feeId })
            });
            toast.success("Payment approved — credentials sent!");
            fetchData();
        } catch { toast.error("Approval failed"); }
    };

    const getPaymentStatus = (prospect: any) => {
        if (!prospect.fees || prospect.fees.length === 0) return { label: 'No Invoice', color: 'bg-gray-100 text-gray-600' };
        const fee = prospect.fees[0];
        switch (fee.status) {
            case 'VERIFYING': return { label: 'Proof Submitted', color: 'bg-amber-100 text-amber-700 border-amber-200' };
            case 'UNPAID': return { label: 'Awaiting Payment', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'PAID': return { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' };
            default: return { label: fee.status, color: 'bg-gray-100 text-gray-600' };
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const prospectsWithProof = prospects.filter(p => p.fees?.[0]?.status === 'VERIFYING');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Admissions</h1>
                <div className="flex gap-2">
                    {prospectsWithProof.length > 0 && (
                        <Badge className="bg-amber-500 text-white">{prospectsWithProof.length} proof(s) to review</Badge>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="prospects" className="gap-2">
                        <Users className="w-4 h-4" />
                        Registration Pipeline
                        {prospects.length > 0 && <Badge variant="secondary" className="ml-1">{prospects.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="gap-2">
                        <UserCheck className="w-4 h-4" />
                        Course Applications
                        {apps.length > 0 && <Badge variant="secondary" className="ml-1">{apps.length}</Badge>}
                    </TabsTrigger>
                </TabsList>

                {/* PROSPECTS TAB */}
                <TabsContent value="prospects" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Registration Fee Applicants</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Students who registered and need to pay the GHS 350 registration fee. Approve their proof to send login credentials.
                            </p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>Registration Code</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Payment Status</TableHead>
                                        <TableHead>Proof</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prospects.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No pending registrations.</TableCell>
                                        </TableRow>
                                    ) : (
                                        prospects.map(prospect => {
                                            const paymentStatus = getPaymentStatus(prospect);
                                            const fee = prospect.fees?.[0];
                                            return (
                                                <TableRow key={prospect.id} className="group">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={prospect.user.image} />
                                                                <AvatarFallback>{prospect.user.name?.[0] || '?'}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-sm">{prospect.user.name}</p>
                                                                <p className="text-xs text-muted-foreground">{prospect.user.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono text-sm font-bold">
                                                            {prospect.registrationCode || '—'}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(prospect.user.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={paymentStatus.color}>{paymentStatus.label}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {fee?.proofUrl ? (
                                                            <Button size="sm" variant="outline" className="gap-1 text-blue-600 border-blue-200" onClick={() => window.open(fee.proofUrl, '_blank')}>
                                                                <FileImage className="w-3 h-3" /> View
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">None</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {fee?.status === 'VERIFYING' && (
                                                            <Button size="sm" onClick={() => handleApproveFee(fee.id)} className="bg-green-600 hover:bg-green-700 gap-1">
                                                                <CheckCircle className="w-3 h-3" /> Approve & Send Credentials
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* APPLICATIONS KANBAN TAB */}
                <TabsContent value="applications" className="mt-4">
                    <div className="h-[calc(100vh-250px)] overflow-x-auto">
                        <div className="flex gap-4 min-w-[1000px] h-full">
                            {STATUSES.map(status => (
                                <div key={status} className="flex-1 min-w-[250px] flex flex-col bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                                        <h3 className="font-bold text-sm text-slate-700">{status}</h3>
                                        <Badge variant="secondary">{apps.filter(a => a.status === status).length}</Badge>
                                    </div>
                                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                        {apps.filter(a => a.status === status).map(app => (
                                            <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={app.student.user.image} />
                                                            <AvatarFallback>{app.student.user.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-bold leading-none">{app.student.user.name}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-1">{app.course.code}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(app.appliedAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {status !== 'PENDING' && (
                                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateStatus(app.id, STATUSES[STATUSES.indexOf(status) - 1])}>
                                                                    <ArrowLeft className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            {['PENDING', 'REVIEWING'].includes(status) && (
                                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateStatus(app.id, 'REJECTED')}>
                                                                    <XCircle className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            {status !== 'APPROVED' && (
                                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(app.id, STATUSES[STATUSES.indexOf(status) + 1])}>
                                                                    <ArrowRight className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
