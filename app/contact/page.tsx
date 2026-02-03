"use client";
import { useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
};


export default function ContactPage() {
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
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar theme="dark" />
      
      <div className="grow">
        <PageHero 
          title="Contact Us"
          subtitle="Have questions about our EASA programmes? Reach out to our admissions team."
          backgroundImage="/airport.jpg"
        />

        <div className="container mx-auto px-6 py-16 -mt-24 relative z-20">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-5 gap-0 border border-slate-100">
            
            {/* --- LEFT: Contact Info & Map --- */}
            <div className="lg:col-span-2 bg-aerojet-blue p-8 md:p-12 text-white flex flex-col">
                <h2 className="text-2xl font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Get in Touch</h2>
                
                <div className="space-y-8 grow">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">📍</div>
                        <div>
                            <h3 className="font-bold text-aerojet-sky text-xs uppercase tracking-widest mb-1">Campus Location</h3>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                ATTC Small Engines Department,<br/> 
                                Kokomlemle, Accra, Ghana
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">📞</div>
                        <div>
                            <h3 className="font-bold text-aerojet-sky text-xs uppercase tracking-widest mb-1">Admissions Line</h3>
                            <p className="text-sm text-slate-300 font-medium">+233-20-984-8423</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">✉️</div>
                        <div>
                            <h3 className="font-bold text-aerojet-sky text-xs uppercase tracking-widest mb-1">Official Email</h3>
                            <p className="text-sm text-slate-300 font-medium">trainingprograms@aerojet-academy.com</p>
                        </div>
                    </div>
                </div>

                {/* Interactive Map */}
                <div className="mt-12 h-60 rounded-2xl overflow-hidden border border-white/10 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.786377777076!2d-0.2085864241476562!3d5.598254333214875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf90a079636901%3A0x8772a4667556553a!2sAccra%20Technical%20Training%20Centre!5e0!3m2!1sen!2sgh!4v1709220000000!5m2!1sen!2sgh" 
                        width="100%" 
                        height="100%" 
                        style={{border:0}} 
                        allowFullScreen={true} 
                        loading="lazy" 
                    ></iframe>
                </div>
            </div>

            {/* --- RIGHT: Contact Form --- */}
            <div className="lg:col-span-3 p-8 md:p-12 bg-white">
                 <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-2">Send us a Message</h2>
                 <p className="text-slate-500 mb-10">Fill out the form below and our admissions team will get back to you via email.</p>

                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                        <input 
                            type="text" 
                            id="name" 
                            required 
                            className={inputClasses}
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                        <input 
                            type="email" 
                            id="email" 
                            required 
                            className={inputClasses}
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your Enquiry</label>
                        <textarea 
                            id="message" 
                            rows={5} 
                            required 
                            className={inputClasses}
                            placeholder="How can we help you today?"
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isSending}
                            className="w-full bg-aerojet-sky text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl shadow-lg hover:bg-aerojet-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSending ? "Processing..." : "Send Message →"}
                        </button>
                    </div>
                 </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
