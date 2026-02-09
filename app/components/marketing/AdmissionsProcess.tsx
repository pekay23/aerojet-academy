"use client";
import Link from 'next/link';

export default function AdmissionsProcess() {
  const steps = [
    {
      step: "01",
      title: "Registration Invoice",
      desc: "We will first issue an invoice for the GHS 350 registration fee. Payment of the registration fee is required before you can complete the online application."
    },
    {
      step: "02",
      title: "Online Application Form",
      desc: "Once payment is received and you send us confirmation, we will provide a link to complete the online application form for Academy review and approval."
    },
    {
      step: "03",
      title: "Confirmation Invoice",
      desc: "Upon approval, we will issue an invoice for the Confirmation payment applicable to your selected training programme. Once paid, your seat is secured."
    },
    {
      step: "04",
      title: "Onboarding & Access",
      desc: "After confirmation, you will be onboarded onto our student portal. You will receive your start date or receive a link to access your learning materials."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-aerojet-blue uppercase tracking-tight mb-4">
            How to Enroll
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            Follow our structured enrollment pathway to secure your place at the academy.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="relative p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-aerojet-sky transition-all duration-500 shadow-sm hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-aerojet-sky text-white flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                {item.step}
              </div>
              <h3 className="text-lg font-black text-aerojet-blue mb-3 uppercase tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/register" className="bg-aerojet-blue text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-sky shadow-xl transition-all active:scale-95 inline-block">
            Start Your Registration →
          </Link>
        </div>
      </div>
    </section>
  );
}
