"use client";
import { useState } from 'react';
import { toast } from 'sonner';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ name: '', email: '', programme: 'Full-Time B1.1/B2' });
  const [isSending, setIsSending] = useState(false);

  const inputClasses = "mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 shadow-sm focus:outline-none focus:border-aerojet-sky focus:ring-1 focus:ring-aerojet-sky transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, email: formData.email,
          message: `REGISTRATION REQUEST: Interested in ${formData.programme}.`
        }),
      });
      if (res.ok) {
        toast.success("Request sent! We will email the invoice shortly.");
        setFormData({ name: '', email: '', programme: 'Full-Time B1.1/B2' });
      }
    } catch (error) { toast.error("An error occurred."); }
    finally { setIsSending(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <input type="text" required className={inputClasses} placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
      <input type="email" required className={inputClasses} placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
      <select className={inputClasses} value={formData.programme} onChange={(e) => setFormData({...formData, programme: e.target.value})}>
        <option>Full-Time EASA B1.1/B2</option>
        <option>Modular Training (Part-66)</option>
        <option>Examination-Only (Self-Study)</option>
      </select>
      <button type="submit" disabled={isSending} className="w-full bg-aerojet-sky text-white font-black uppercase py-4 rounded-xl shadow-lg transition-all active:scale-95">
        {isSending ? 'Sending Request...' : 'Request Registration Invoice'}
      </button>
    </form>
  );
}
