"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadDropzone } from '@/app/utils/uploadthing';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, UploadCloud, FileText } from 'lucide-react';

export default function ApplyWizardClient({ formId }: { formId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [data, setData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    program: 'Full-Time B1.1',
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
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          programme: data.program,
          sourceId: formId,
          documents: { id: data.idDocUrl, cv: data.cvDocUrl }
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
        <Button className="mt-8 bg-green-600 hover:bg-green-700" onClick={() => router.push('/')}>
          Return Home
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-xl border-slate-200">
      <CardHeader className="bg-aerojet-blue text-white rounded-t-xl">
        <CardTitle className="text-center">
          <span className="block text-sm font-normal text-blue-200 uppercase tracking-widest mb-1">New Student Application</span>
          2026/2027 Academic Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-aerojet-sky' : 'bg-slate-100'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-aerojet-sky' : 'bg-slate-100'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-aerojet-sky' : 'bg-slate-100'}`} />
        </div>

        {/* STEP 1: PERSONAL INFO */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="First Name" value={data.firstName} onChange={e => setData({...data, firstName: e.target.value})} />
              <Input placeholder="Last Name" value={data.lastName} onChange={e => setData({...data, lastName: e.target.value})} />
            </div>
            <Input type="email" placeholder="Email Address" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
            <Input type="tel" placeholder="Phone Number" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
            
            <div className="pt-4 flex justify-end">
              <Button onClick={handleNext} className="bg-aerojet-blue">
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
                <SelectItem value="Full-Time B1.1">EASA Part-66 B1.1 (Mechanical)</SelectItem>
                <SelectItem value="Full-Time B2">EASA Part-66 B2 (Avionics)</SelectItem>
                <SelectItem value="Modular">Modular Fast-Track</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid md:grid-cols-2 gap-4">
              {/* ID UPLOAD */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50">
                {/* FIX: Removed 'block' class to solve conflict */}
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
                    // FIX: Explicit error handling type
                    onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`); }}
                    appearance={{ button: "bg-aerojet-blue text-white text-xs w-full", allowedContent: "hidden" }}
                    content={{ button: "Click to Upload ID" }}
                  />
                )}
              </div>

              {/* CV UPLOAD */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50">
                {/* FIX: Removed 'block' class to solve conflict */}
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
                    // FIX: Explicit error handling type
                    onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`); }}
                    appearance={{ button: "bg-aerojet-blue text-white text-xs w-full", allowedContent: "hidden" }}
                    content={{ button: "Click to Upload CV" }}
                  />
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
              <Button onClick={handleNext} className="bg-aerojet-blue">Review <ArrowRight className="w-4 h-4 ml-2" /></Button>
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
                <span className="font-bold text-aerojet-sky">{data.program}</span>
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
              <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full ml-4 shadow-lg shadow-green-200">
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
