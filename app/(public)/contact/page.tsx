import { Metadata } from "next";
import Hero from "../_components/Hero";
import SectionReveal from "../_components/SectionReveal";
import ContactForm from "./_components/ContactForm";

export const metadata: Metadata = { title: "Contact | Aerojet Academy" };

export default function ContactPage() {
  return (
    <div className="bg-slate-50">
      <Hero title="Contact Us" subtitle="Reach out to our admissions team for enquiries about EASA programmes." backgroundImage="/images/hero/contact-hero.webp"/>

      <div className="max-w-5xl mx-auto px-6 py-16 -mt-20 relative z-20">
        <SectionReveal>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-5 border border-slate-100">
            {/* Info Side */}
            <div className="lg:col-span-2 bg-aerojet-blue p-8 sm:p-10 text-white">
              <h2 className="text-xl font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Get in Touch</h2>
              <div className="space-y-7">
                {[
                  { emoji: "📍", label: "Campus Location", value: "ATTC Small Engines Department,\nKokomlemle, Accra, Ghana" },
                  { emoji: "📞", label: "Admissions Line", value: "+233-20-984-8423" },
                  { emoji: "✉️", label: "Official Email", value: "trainingprograms@aerojet-academy.com" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">{item.emoji}</div>
                    <div>
                      <h3 className="font-bold text-aerojet-sky text-xs uppercase tracking-widest mb-1">{item.label}</h3>
                      <p className="text-sm text-slate-300 whitespace-pre-line">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 h-48 rounded-2xl overflow-hidden border border-white/10 grayscale opacity-70 relative bg-slate-800">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.786377777076!2d-0.2085864241476562!3d5.598254333214875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf90a079636901%3A0x8772a4667556553a!2sAccra%20Technical%20Training%20Centre!5e0!3m2!1sen!2sgh!4v1709220000000!5m2!1sen!2sgh"
                  width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>

            {/* Form Side */}
            <div className="lg:col-span-3 p-8 sm:p-10">
              <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-2">Send us a Message</h2>
              <p className="text-slate-500 mb-8 text-sm">Fill out the form below and we will get back to you via email.</p>
              <ContactForm />
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}