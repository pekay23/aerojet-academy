"use client";

import { useState } from 'react';
import { toast } from 'sonner';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', // Added Phone Number
    programme: 'Full-Time EASA B1.1/B2' 
  });
  
  const [isSending, setIsSending] = useState(false);

  const inputClasses = "mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 shadow-sm focus:outline-none focus:border-aerojet-sky focus:ring-1 focus:ring-aerojet-sky transition-all placeholder:text-slate-400";
  const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, 
          email: formData.email,
          phone: formData.phone,
          programme: formData.programme
        }),
      });

      if (res.ok) {
        toast.success("Registration initiated! Please check your email for the invoice.");
        setFormData({ name: '', email: '', phone: '', programme: 'Full-Time EASA B1.1/B2' });
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Registration failed. Please try again.");
      }
    } catch (error) { 
      toast.error("An unexpected network error occurred."); 
    } finally { 
      setIsSending(false); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className={labelClasses}>Full Name</label>
        <input id="name" type="text" required className={inputClasses} placeholder="e.g. Ama Serwaa" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
      </div>

      <div>
        <label htmlFor="email" className={labelClasses}>Email Address</label>
        <input id="email" type="email" required className={inputClasses} placeholder="student@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
      </div>

      <div>
        <label htmlFor="phone" className={labelClasses}>Phone Number</label>
        <input id="phone" type="tel" required className={inputClasses} placeholder="+233 55 555 5555" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
      </div>

      <div>
        <label htmlFor="programme" className={labelClasses}>Select Programme</label>
        <div className="relative">
          <select id="programme" className={`${inputClasses} appearance-none cursor-pointer`} value={formData.programme} onChange={(e) => setFormData({...formData, programme: e.target.value})}>
            <option>Full-Time EASA B1.1/B2</option>
            <option>Modular Training (Part-66)</option>
            <option>Examination-Only (Self-Study)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={isSending} className="w-full bg-aerojet-sky text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl shadow-lg hover:bg-aerojet-blue transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
          {isSending ? ('Processing...') : (<>Request Registration Invoice <span className="text-lg">→</span></>)}
        </button>
        <p className="text-center text-xs text-slate-400 mt-4 font-medium">A GHS 350.00 non-refundable fee applies.</p>
      </div>
    </form>
  );
}
