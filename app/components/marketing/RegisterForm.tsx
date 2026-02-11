"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Info, Copy, Check, CheckCircle2, CreditCard, Upload, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationCode, setRegistrationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    program: 'Full-Time'
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(registrationCode);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          programme: data.program
        })
      });

      const responseData = await res.json();

      if (res.ok) {
        setRegistrationCode(responseData.registrationCode);
        setSubmitted(true);
        toast.success("Application submitted successfully!");
      } else {
        toast.error(responseData.error || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ─── SUCCESS SCREEN ───
  if (submitted) {
    const steps = [
      { label: 'Register', icon: CheckCircle2, done: true },
      { label: 'Pay', icon: CreditCard, done: false, active: true },
      { label: 'Upload Proof', icon: Upload, done: false },
    ];

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                  ${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-aerojet-blue text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-400'}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-2
                  ${step.done ? 'text-green-600' : step.active ? 'text-aerojet-blue' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-full -mt-5 mx-1 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Success Message */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Application Submitted!</h3>
          <p className="text-sm text-gray-500 mt-1">Check your email for detailed instructions.</p>
        </div>

        {/* Registration Code */}
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Your Registration Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl font-black text-aerojet-blue tracking-[0.15em]">
              {registrationCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-blue-400" />}
            </button>
          </div>
          <p className="text-xs text-blue-500 mt-2">Use this code as your payment reference</p>
        </div>

        {/* Bank Details */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-slate-800 px-5 py-3">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment Details
            </h4>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-600">
              Please pay the registration fee of <strong className="text-slate-800">GHS 350.00</strong> to:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-bold text-slate-800">FNB Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account No.</span>
                <span className="font-bold text-slate-800 font-mono">1020003980687</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Branch</span>
                <span className="font-bold text-slate-800">330102</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Reference</span>
                <span className="font-bold text-aerojet-blue font-mono">{registrationCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload CTA */}
        <Link
          href={`/upload-proof?code=${registrationCode}`}
          className="w-full bg-aerojet-blue hover:bg-aerojet-sky text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" /> Upload Payment Proof <ExternalLink className="w-4 h-4 ml-1" />
        </Link>

        <p className="text-xs text-center text-gray-400">
          After uploading, our admissions team will verify your payment and send your portal login credentials via email.
        </p>
      </div>
    );
  }

  // ─── REGISTRATION FORM ───
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all bg-white text-slate-900"
            value={data.firstName}
            onChange={e => setData({ ...data, firstName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all bg-white text-slate-900"
            value={data.lastName}
            onChange={e => setData({ ...data, lastName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          required
          type="email"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all bg-white text-slate-900"
          value={data.email}
          onChange={e => setData({ ...data, email: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          required
          type="tel"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all bg-white text-slate-900"
          value={data.phone}
          onChange={e => setData({ ...data, phone: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Programme</label>
        <div className="relative">
          <select
            value={data.program}
            onChange={e => setData({ ...data, program: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-aerojet-blue outline-none transition-all appearance-none bg-white text-slate-900"
          >
            <option value="Full-Time">EASA Part-66 Full-Time (B1.1 / B2)</option>
            <option value="Modular">EASA Part-66 Modular</option>
            <option value="Examination-Only">Examination Only</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
      </div>

      {/* FEE NOTICE */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-aerojet-blue shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-aerojet-blue block mb-1">Registration Fee Required</span>
          A non-refundable fee of <strong>GHS 350.00</strong> is required to process your application. You will receive payment details and a link to upload your proof of payment immediately after registering.
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-aerojet-blue hover:bg-aerojet-sky text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start Application <ArrowRight className="w-5 h-5" /></>}
      </button>

      <p className="text-xs text-center text-gray-500 mt-4">
        By clicking Start, you agree to our Terms. Your account login details will be emailed after payment verification.
      </p>
    </form>
  );
}
