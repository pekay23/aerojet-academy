"use client";
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    programme: 'Full-Time B1.1/B2',
  });
  const [isSending, setIsSending] = useState(false);

  const inputClasses = "mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 shadow-sm focus:outline-none focus:border-aerojet-sky focus:ring-1 focus:ring-aerojet-sky transition-all placeholder:text-slate-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // We reuse the contact API to notify your team of the registration interest
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `REGISTRATION REQUEST: Interested in ${formData.programme}. Please issue GHS 350 registration invoice.`
        }),
      });

      if (res.ok) {
        toast.success("Request sent! Please check your email for the registration invoice.");
        setFormData({ name: '', email: '', programme: 'Full-Time B1.1/B2' });
      } else {
        toast.error("Failed to send request. Please contact us directly.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-50 pt-20">
      <Navbar theme="light" />

      <div className="grow flex items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          
          <div className="bg-aerojet-blue p-8 text-center text-white">
            <h2 className="text-3xl font-black uppercase tracking-tight">
              Start Your Journey
            </h2>
            <p className="mt-2 text-blue-100 text-sm font-medium">
              Request your registration invoice to unlock the Student Portal.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-bold text-aerojet-blue text-xs uppercase tracking-widest mb-1">Step 1</h3>
                    <p className="text-[11px] text-slate-500 leading-tight">Pay the GHS 350 one-time registration fee via bank transfer.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-bold text-aerojet-blue text-xs uppercase tracking-widest mb-1">Step 2</h3>
                    <p className="text-[11px] text-slate-500 leading-tight">Admin verifies payment and creates your secure portal account.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed text-center italic">
                  "Registration grants you access to the full online application form, 
                  module booking, and certified learning materials."
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="full-name" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className={inputClasses}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label htmlFor="email-address" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className={inputClasses}
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label htmlFor="programme" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Programme of Interest</label>
                  <select 
                    className={inputClasses}
                    value={formData.programme}
                    onChange={(e) => setFormData({...formData, programme: e.target.value})}
                  >
                    <option>Full-Time EASA B1.1/B2</option>
                    <option>Modular Training (Part-66)</option>
                    <option>Examination-Only (Self-Study)</option>
                    <option>Revision Support (8-Week Block)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSending}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-xs font-black uppercase tracking-[0.2em] text-white bg-aerojet-sky hover:bg-aerojet-blue shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSending ? 'Sending Request...' : 'Request Registration Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-slate-50 p-6 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              By proceeding, you agree to the{' '}
              <Link href="/legal/terms" className="text-aerojet-sky hover:underline">
                Online Application Terms
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
