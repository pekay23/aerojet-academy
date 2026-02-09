"use client";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSending, setIsSending] = useState(false);

  const inputClasses = "mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 shadow-sm focus:outline-none focus:border-aerojet-sky focus:ring-1 focus:ring-aerojet-sky transition-all placeholder:text-slate-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Message sent! Our team will contact you shortly.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error("Failed to send message.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
        <input 
          type="text" id="name" required className={inputClasses} placeholder="John Doe"
          value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
        <input 
          type="email" id="email" required className={inputClasses} placeholder="john@example.com"
          value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your Enquiry</label>
        <textarea 
          id="message" rows={5} required className={inputClasses} placeholder="How can we help you today?"
          value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}
        ></textarea>
      </div>

      <div className="pt-4">
        <button 
          type="submit" disabled={isSending}
          className="w-full bg-aerojet-sky text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl shadow-lg hover:bg-aerojet-blue transition-all disabled:opacity-50 active:scale-95"
        >
          {isSending ? "Processing..." : "Send Message →"}
        </button>
      </div>
    </form>
  );
}
