"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/app/utils/uploadthing"; // Corrected path
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function UploadProofClient() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [registrationCode, setRegistrationCode] = useState(codeFromUrl);
  const [email, setEmail] = useState(emailFromUrl);
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!registrationCode && !email) || !proofUrl) {
      toast.error("Please provide your registration code (or email) and upload proof.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/public/submit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationCode,
          email,
          proofUrl
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to submit proof");

      setSubmitted(true);
      toast.success("Proof submitted successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-none border-none">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-green-700">Submission Successful!</CardTitle>
            <CardDescription>
              Your proof of payment has been uploaded. Our admissions team will review it shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Once approved, you will receive an email with your login credentials to access the student portal.
            </p>
            <Button asChild className="w-full bg-aerojet-blue hover:bg-aerojet-sky" variant="default">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-none border-none">
      <CardHeader>
        {/* Header is handled by the parent page mostly, but we can add specific instructions here if needed */}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Registration Code</Label>
            <Input
              id="code"
              placeholder="AATA-XXXX"
              value={registrationCode}
              onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
              className="bg-white border-slate-200 text-slate-900"
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
            />
            <p className="text-[10px] text-muted-foreground">
              Use the code sent to your email.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-xs text-slate-400 font-bold uppercase">OR</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="applicant@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-slate-200 text-slate-900"
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label>Proof of Payment</Label>
            <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
              {proofUrl ? (
                <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> File Uploaded Successfully!
                </div>
              ) : (
                <UploadButton
                  endpoint="paymentProof"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      setProofUrl(res[0].url);
                      toast.success("Upload Completed");
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`ERROR! ${error.message}`);
                  }}
                />
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-aerojet-blue hover:bg-aerojet-sky h-12 text-sm font-bold uppercase tracking-widest" disabled={loading || !proofUrl || (!registrationCode && !email)}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Proof"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
