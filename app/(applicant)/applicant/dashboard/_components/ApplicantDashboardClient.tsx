"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Plus, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ApplicantDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const dashRes = await fetch('/api/portal/dashboard');
        const dashData = await dashRes.json();

        setData(dashData);

        if (dashData.cohort?.includes('Exam') || dashData.cohort === 'Modular') {
          const poolsRes = await fetch('/api/pools');
          const poolsData = await poolsRes.json();
          setPools(poolsData.pools || []);
        }
        setLoading(false);
      } catch {
        toast.error("Session sync failed");
        setLoading(false);
      }
    };
    init();
  }, [router]);

  if (loading || !data) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const isExamOnly = data.cohort?.includes('Exam') || data.cohort === 'Modular';

  // --- VIEW 1: MODULAR / EXAM APPLICANT ---
  if (isExamOnly) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Exam Marketplace</h1>
            <p className="text-muted-foreground">Join an existing pool or request a new session.</p>
          </div>
          <Button onClick={() => router.push('/student/exam-pools')} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pools.length > 0 ? pools.slice(0, 4).map(pool => (
            <Card key={pool.id} className="border-border hover:border-primary/50 transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <Badge variant={pool.status === 'NEARLY_FULL' ? 'destructive' : 'secondary'} className="w-fit mb-2">
                  {pool.status.replace('_', ' ')}
                </Badge>
                <CardTitle className="text-lg">{pool.name}</CardTitle>
                <CardDescription>{new Date(pool.examDate).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Filled</span>
                    <span className="font-mono">{pool.currentCount}/{pool.maxCandidates}</span>
                  </div>
                  <Progress value={pool.fillPercentage} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4"><Plus className="w-8 h-8 text-primary" /></div>
              <h3 className="text-lg font-semibold">No active pools found</h3>
              <p className="text-muted-foreground mb-6">Start a new pool to invite other students.</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: FULL-TIME APPLICANT ---
  const enrollmentStatus = data.enrollmentStatus || 'PROSPECT';
  const isProspect = enrollmentStatus === 'PROSPECT';
  const isApplicant = enrollmentStatus === 'APPLICANT';

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="bg-linear-to-r from-blue-900 to-blue-800 p-8 rounded-2xl text-white mb-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome to Aerojet, {data.name}!</h1>
        <p className="text-blue-100 opacity-90 mb-6">
          {isProspect && "Complete your registration payment to unlock your full application."}
          {isApplicant && !data.application && "Your registration is approved. Please complete your application form."}
          {isApplicant && data.application && "Application received. Complete your seat confirmation deposit to secure your place."}
        </p>

        {/* Onboarding Progress Bar */}
        <div className="bg-blue-950/30 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-400/30 z-0"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-green-400 transition-all duration-500 z-0" 
                 style={{ width: isProspect ? '15%' : isApplicant && !data.application ? '50%' : '85%' }}></div>

            {/* Steps */}
            {[
              { label: 'Registered', status: 'done' },
              { label: 'Fee Paid', status: isProspect ? 'current' : 'done' },
              { label: 'Applied', status: isApplicant && !data.application ? 'current' : isApplicant && data.application ? 'done' : 'pending' },
              { label: 'Admitted', status: 'pending' }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                  ${step.status === 'done' ? 'bg-green-500 text-white' : 
                    step.status === 'current' ? 'bg-blue-400 text-blue-950 border-4 border-blue-900' : 
                    'bg-blue-900/50 text-blue-300 border-2 border-blue-800'}`}>
                  {step.status === 'done' ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-xs font-medium ${step.status === 'pending' ? 'text-blue-300/50' : 'text-blue-100'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {isProspect && (
          <Card className="border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 relative">
            <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Action Required</div>
            <CardHeader>
              <CardTitle>Registration Fee</CardTitle>
              <CardDescription>Complete your application registration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-blue-900 dark:text-blue-400 mb-6">GHS 350.00</div>
              <p className="text-sm text-muted-foreground mb-6">
                This non-refundable fee activates your application and grants access to the admissions process.
              </p>
              {/* Find the registration fee if it exists */}
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-white font-bold" onClick={() => {
                const regFee = data.fees?.find((f: any) => f.description?.includes('Registration'));
                if (regFee) {
                  router.push(`/applicant/payment?feeId=${regFee.id}`);
                } else {
                  // If no fee, maybe go to a page that creates it or just generic payment (fallback)
                  router.push('/applicant/payment');
                }
              }}>
                View Invoice & Pay <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {isApplicant && !data.application && (
          <Card className="border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 relative">
            <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Next Step</div>
            <CardHeader>
              <CardTitle>Complete Application</CardTitle>
              <CardDescription>Submit your details and documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Please fill out the application form and upload your qualifications to proceed.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-white font-bold" onClick={() => router.push('/applicant/application')}>
                Start Application <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {isApplicant && data.application && (
          <Card className="border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 relative">
            <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Action Required</div>
            <CardHeader>
              <CardTitle>Seat Confirmation Deposit</CardTitle>
              <CardDescription>Secure your place in the upcoming intake.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-blue-900 dark:text-blue-400 mb-6">40% <span className="text-sm font-medium text-muted-foreground">Initial Fee</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> Guaranteed placement</li>
                <li className="flex items-center gap-3 text-sm"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> Access to digital library</li>
              </ul>

              {/* Check if Deposit Fee exists */}
              {(() => {
                const depositFee = data.fees?.find((f: any) => f.description?.includes('Deposit') || f.amount > 1000);
                if (depositFee) {
                  if (depositFee.status === 'PAID') {
                    return (
                      <div className="bg-green-100 p-4 rounded-lg text-green-800 font-bold text-center">
                        <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                        Deposit Paid - Enrollment Confirmed!
                      </div>
                    );
                  }
                  return (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-white font-bold" onClick={() => router.push(`/applicant/payment?feeId=${depositFee.id}`)}>
                      Pay Deposit (GHS {depositFee.amount}) <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  );
                } else {
                  return (
                    <div className="text-center p-4 bg-slate-100 rounded-lg text-slate-500 text-sm">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Generating Invoice...
                    </div>
                  );
                }
              })()}

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
