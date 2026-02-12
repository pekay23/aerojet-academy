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
import { Loader2, CheckCircle2, X, UploadCloud, ArrowRight } from 'lucide-react';

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

          <div className="space-y-4 pt-4">
            <Label className="text-slate-700 font-semibold flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-aerojet-blue" />
              Proof of Payment
            </Label>

            <div className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${proofUrl
              ? "border-green-500 bg-green-50/30"
              : "border-slate-300 bg-slate-50 hover:border-aerojet-blue hover:bg-slate-100/50"
              }`}>
              {proofUrl ? (
                <div className="p-4">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-green-200 bg-white shadow-sm group">
                    <img
                      src={proofUrl}
                      alt="Payment Proof"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setProofUrl("")}
                        className="rounded-full h-10 w-10 p-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-green-700 font-medium text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready to submit
                  </div>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center min-h-[180px]">
                  <UploadButton
                    endpoint="paymentProof"
                    appearance={{
                      button: "bg-aerojet-blue hover:bg-aerojet-sky transition-all duration-300 font-bold uppercase tracking-widest text-xs px-6 py-2 shadow-lg shadow-blue-500/20",
                      container: "w-full",
                      allowedContent: "text-slate-400 text-[10px] mt-2"
                    }}
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setProofUrl(res[0].url);
                        toast.success("File uploaded successfully!");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload error: ${error.message}`);
                    }}
                  />
                  {!proofUrl && (
                    <div className="mt-4 pointer-events-none">
                      <p className="text-sm font-medium text-slate-500">
                        Drag and drop your receipt or click the button
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        SVG, PNG, JPG or PDF (MAX. 4MB)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            type="submit"
            className={`w-full h-14 text-sm font-black uppercase tracking-[0.15em] transition-all duration-500 relative overflow-hidden group shadow-xl ${!proofUrl || (!registrationCode && !email)
              ? "bg-slate-200 text-slate-400"
              : "bg-aerojet-blue hover:bg-blue-600 text-white shadow-blue-500/25 active:scale-[0.98]"
              }`}
            disabled={loading || !proofUrl || (!registrationCode && !email)}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Submit Verification</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}

            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
