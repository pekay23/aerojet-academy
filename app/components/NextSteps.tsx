"use client";
import Link from 'next/link';

export default function NextSteps() {
  const steps = [
    {
      title: "Step 1: Registration Invoice",
      desc: "Submit enquiry via the Register page. We will review and issue your GHS 350 registration invoice."
    },
    {
      title: "Step 2: Online Application Form",
      desc: "Once payment is received and you send us confirmation, we will provide a link to complete the online application form for Academy review and approval."
    },
    {
      title: "Step 3: Confirmation Invoice",
      desc: "Upon approval, we will issue an invoice for the Confirmation payment applicable to your selected training program. Once paid, your seat is secured."
    },
    {
      title: "Step 4: Student Portal Onboarding",
      desc: "Once your payment is verified, we create your official account and you receive login credentials."
    }
  ];

  return (
    <section className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl my-16">
      <div className="p-8 md:p-12">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 text-center">
          How to Enroll: <span className="text-aerojet-sky">Your Path to the Skies</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4 group">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-aerojet-sky text-white flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                {index + 1}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-white">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center border-t border-white/10 pt-8">
          <p className="text-slate-400 text-sm mb-6">Ready to begin? Start your registration to receive your first invoice.</p>
          <Link href="/register" className="bg-white text-slate-900 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-sky hover:text-white transition-all">
            Start Registration Now
          </Link>
        </div>
      </div>
    </section>
  );
}
