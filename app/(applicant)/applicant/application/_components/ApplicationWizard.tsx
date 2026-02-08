"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadDropzone } from '@/app/utils/uploadthing'; 
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, UploadCloud, FileText } from 'lucide-react';

interface WizardProps {
  initialData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }
}

export default function ApplicationWizard({ initialData }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State - Using initialData if available
  const [data, setData] = useState({
    firstName: initialData?.firstName || '', 
    lastName: initialData?.lastName || '', 
    email: initialData?.email || '', 
    phone: initialData?.phone || '',
    program: 'Full-Time',
    idDocUrl: '',
    cvDocUrl: '' 
  });

  const handleNext = () => {
    if (step === 1 && (!data.firstName || !data.lastName || !data.email)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/applications', { // Updated API endpoint for Application submission
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Adjust payload to match your Application API expectation
          educationLevel: "High School", // Add fields as per your schema
          institutionName: "N/A",
          idDocumentUrl: data.idDocUrl,
          certificateUrl: data.cvDocUrl,
          program: data.program
        })
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Application submitted successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Submission failed.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-lg text-center p-8 border-green-100 bg-green-50/50">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-900">Application Received</h2>
        <p className="text-green-700 mt-2">
          Thank you, {data.firstName}. We have sent a confirmation email to <strong>{data.email}</strong>.
        </p>
        <Button className="mt-8 bg-green-600 hover:bg-green-700" onClick={() => router.push('/applicant/dashboard')}>
          Go to Dashboard
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border-border">
      <CardHeader className="bg-slate-50 border-b border-border rounded-t-xl">
        <CardTitle className="flex justify-between items-center">
          <span>New Student Application</span>
          <span className="text-sm font-normal text-muted-foreground bg-white px-3 py-1 rounded-full border">2026/27 Intake</span>
        </CardTitle>
        <CardDescription>Complete the steps below to start your journey.</CardDescription>
      </CardHeader>
      
      <CardContent className="p-8">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-aerojet-blue' : 'bg-slate-100'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-aerojet-blue' : 'bg-slate-100'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-aerojet-blue' : 'bg-slate-100'}`} />
        </div>

        {/* STEP 1: PERSONAL INFO */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-sm font-medium mb-1 block">First Name</label>
                  <Input placeholder="First Name" value={data.firstName} onChange={e => setData({...data, firstName: e.target.value})} />
              </div>
              <div>
                  <label className="text-sm font-medium mb-1 block">Last Name</label>
                  <Input placeholder="Last Name" value={data.lastName} onChange={e => setData({...data, lastName: e.target.value})} />
              </div>
            </div>
            <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" placeholder="Email Address" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
            </div>
            <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input type="tel" placeholder="Phone Number" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={handleNext} className="bg-aerojet-blue hover:bg-aerojet-sky text-white">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PROGRAM & DOCS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">Program Selection</h3>
            <Select value={data.program} onValueChange={v => setData({...data, program: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-Time">EASA Part-66 Full-Time (B1.1 / B2)</SelectItem>
                <SelectItem value="Modular">EASA Part-66 Modular</SelectItem>
                <SelectItem value="Examination-Only">Examination Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid md:grid-cols-2 gap-4">
              {/* ID UPLOAD */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4"/> Passport / ID
                </label>
                {data.idDocUrl ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-white p-2 rounded border">
                    <CheckCircle2 className="w-4 h-4"/> Uploaded
                  </div>
                ) : (
                  <UploadDropzone 
                    endpoint="paymentProof"
                    onClientUploadComplete={(res: any) => {
                      if(res?.[0]) { setData({...data, idDocUrl: res[0].url}); toast.success("ID Uploaded"); }
                    }}
                    onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`); }}
                    appearance={{ button: "bg-[#002a5c] text-white text-xs w-full", allowedContent: "hidden" }}
                    content={{ button: "Click to Upload ID" }}
                  />
                )}
              </div>

              {/* CV UPLOAD */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4"/> CV / Certificates
                </label>
                {data.cvDocUrl ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-white p-2 rounded border">
                    <CheckCircle2 className="w-4 h-4"/> Uploaded
                  </div>
                ) : (
                  <UploadDropzone 
                    endpoint="paymentProof"
                    onClientUploadComplete={(res: any) => {
                      if(res?.[0]) { setData({...data, cvDocUrl: res[0].url}); toast.success("CV Uploaded"); }
                    }}
                    onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`); }}
                    appearance={{ button: "bg-[#002a5c] text-white text-xs w-full", allowedContent: "hidden" }}
                    content={{ button: "Click to Upload CV" }}
                  />
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
              <Button onClick={handleNext} className="bg-aerojet-blue hover:bg-aerojet-sky text-white">Review <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">Confirm & Submit</h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Applicant</span>
                <span className="font-bold">{data.firstName} {data.lastName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Program</span>
                <span className="font-bold text-aerojet-blue">{data.program}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Documents</span>
                <span className="font-bold">
                  {data.idDocUrl && data.cvDocUrl ? "All Uploaded ✅" : "Partial / Missing ⚠️"}
                </span>
              </div>
            </div>
            
            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full ml-4 shadow-lg shadow-green-200 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                Submit Application
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
