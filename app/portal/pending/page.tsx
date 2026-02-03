"use client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UploadButton } from "@/app/utils/uploadthing";

export default function PendingPage() {
  const { data: session } = useSession();

  const handleUploadComplete = async (res: any[]) => {
    // Just need to alert the admin, no DB link needed yet for this fee
    toast.success("Proof uploaded! Admin will review and activate your account within 24 hours.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-aerojet-blue">Account Activation Pending</h1>
          <p className="mt-4 text-gray-600">
            Welcome, <span className="font-bold">{session?.user?.name}</span>! Your account is created but not yet active. To unlock the student portal and begin applying for courses, please pay the one-time registration fee.
          </p>

          <div className="my-8 p-6 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm font-bold text-aerojet-blue uppercase tracking-widest">Registration Fee</p>
            <p className="text-5xl font-black text-aerojet-sky mt-2">GHS 350.00</p>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Please make a bank transfer using the details provided on our website. After payment, upload your receipt below for verification.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50">
            <UploadButton
              endpoint="paymentProof"
              onClientUploadComplete={handleUploadComplete}
              // FIX IS HERE: Wrapped in curly braces to return void
              onUploadError={(error) => {
                toast.error(`Upload Failed: ${error.message}`);
              }}
              appearance={{
                  button: "bg-aerojet-sky text-white px-8 py-3 text-base font-bold rounded-lg hover:bg-aerojet-blue transition-all",
                  allowedContent: "text-[10px] text-gray-400 mt-2 uppercase font-black"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
