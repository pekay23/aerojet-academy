import { Metadata } from "next";
import Link from "next/link";
import Hero from "../_components/Hero";
import SectionReveal from "../_components/SectionReveal";
import EnrollmentSteps from "../_components/EnrollmentSteps";
import { ArrowRight, CheckCircle2, BookOpen, GraduationCap, HelpCircle } from "lucide-react";

export const metadata: Metadata = { title: "Admissions | Aerojet Academy" };

export default function AdmissionsPage() {
  return (
    // FIX: Changed main background to white to allow gradient sections to stand out
    <div className="bg-white">
      <Hero 
        title="Admissions" 
        subtitle="Your journey to a global aviation career starts with a simple first step." 
        backgroundImage="/images/hero/admissions.jpg" 
      />

      {/* --- START: GRADIENT WRAPPER --- */}
      <div className="relative overflow-hidden">
        {/* Gradient Blobs */}
        <div 
          className="absolute top-0 left-0 w-[50rem] h-[50rem] bg-white rounded-full opacity-40 blur-3xl -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <div 
          className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-public-secondary rounded-full opacity-10 blur-3xl translate-x-1/2 translate-y-1/2"
          aria-hidden="true"
        />

        {/* Why Choose Us Section */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <SectionReveal>
              <h2 className="text-3xl font-black text-public-primary uppercase tracking-tight mb-6">Why Choose Aerojet?</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                We don't just teach theory; we build careers. Our admissions process is designed to identify and cultivate the most dedicated future engineers. Whether you are a fresh graduate or a professional upskilling, we have a pathway for you.
              </p>
            </SectionReveal>
          </div>
        </section>

        {/* Nav Cards Section */}
        <section className="relative z-10 px-6 pb-20">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
            {[
              { icon: CheckCircle2, title: "Entry Requirements", desc: "Check your eligibility. WASSCE, High School Diplomas, and mature professional entry.", href: "/admissions/entry-requirements", color: "blue" },
              { icon: BookOpen, title: "Fees & Payment", desc: "Transparent pricing. Registration fees, tuition deposits, and flexible payment plans.", href: "/admissions/fees-and-payment", color: "green" },
              { icon: HelpCircle, title: "FAQs", desc: "Common questions about programs, admissions, training, fees, and careers.", href: "/admissions/faq", color: "purple" },
            ].map(({ icon: Icon, title, desc, href, color }, i) => (
              <SectionReveal key={title} delay={i * 0.08}>
                <Link href={href} className="group bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-white/20 hover:shadow-xl hover:border-public-primary transition-all flex flex-col h-full">
                  <div className={`w-12 h-12 bg-${color === "blue" ? "blue" : color === "green" ? "green" : "purple"}-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-public-primary transition-colors`}>
                    <Icon className="w-6 h-6 text-public-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm mb-6 grow">{desc}</p>
                  <span className="text-xs font-black uppercase tracking-widest text-public-secondary flex items-center gap-2">View <ArrowRight className="w-4 h-4" /></span>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </section>
      </div>
      {/* --- END: GRADIENT WRAPPER --- */}
      
      <EnrollmentSteps />

      {/* CTA */}
      <SectionReveal>
        {/* FIX: Changed background from public-primary to public-dark */}
        <section className="bg-public-dark py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Ready to Commit?</h2>
            <p className="text-blue-100/80 mb-8">Applications are currently open for the 2026/2027 Academic Year. Slots are limited.</p>
            <Link href="/register" className="inline-block bg-white text-public-primary px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
              Start Registration Now
            </Link>
          </div>
        </section>
      </SectionReveal>
    </div>
  );
}
