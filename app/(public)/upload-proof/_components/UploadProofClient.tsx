"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadDropzone } from '@/app/utils/uploadthing'; // Ensure this path is correct for your project
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function UploadProofClient() {
  const searchParams = useSearchParams();
  // Auto-fill email if passed in URL from the email link
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkPayment = async () => {
    if (!email || !uploadedFileUrl) {
      toast.error("Please provide your email and upload a file.");
      return;
    }

    setIsLinking(true);
    try {
      // Call a public API route to link this proof to the user's latest UNPAID invoice
      const res = await fetch('/api/public/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, proofUrl: uploadedFileUrl })
      });

      const data = await res.json();

      if (res.ok) {
        setIsSubmitted(true);
        toast.success("Proof submitted successfully!");
      } else {
        toast.error(data.error || "Failed to link payment. Please contact support.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Submission Received</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Our finance team will review your receipt shortly. You will receive a confirmation email once approved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          Registered Email Address
        </label>
        <Input 
          id="email" 
          type="email" 
          placeholder="student@example.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="bg-slate-50 border-slate-200"
        />
        <p className="text-[10px] text-slate-400 ml-1">
          Must match the email you used during registration.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          Upload Receipt (PDF/Image)
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
          <UploadDropzone
            endpoint="paymentProof" // Ensure this matches your core.ts router name
            onClientUploadComplete={(res) => {
              if (res && res[0]) {
                setUploadedFileUrl(res[0].url);
                toast.success("File uploaded!");
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
            appearance={{
              button: "bg-aerojet-sky text-white text-sm px-4 py-2 rounded-md",
              allowedContent: "text-slate-400 text-xs"
            }}
          />
        </div>
        {uploadedFileUrl && (
          <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 p-2 rounded-lg">
            <CheckCircle2 className="w-3 h-3" /> File ready to submit
          </div>
        )}
      </div>

      <Button 
        onClick={handleLinkPayment} 
        disabled={!uploadedFileUrl || !email || isLinking}
        className="w-full bg-aerojet-blue hover:bg-aerojet-sky py-6 text-sm font-bold uppercase tracking-widest shadow-lg"
      >
        {isLinking ? (
          <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing... </>
        ) : (
          "Submit Proof for Verification"
        )}
      </Button>
    </div>
  );
}
