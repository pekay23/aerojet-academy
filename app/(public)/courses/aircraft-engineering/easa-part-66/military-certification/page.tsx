import { Metadata } from "next";
import Link from "next/link";
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'
import { CheckCircle2, Clock, AlertCircle, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Military / Industry Certification (1 Year) | Aerojet Academy",
  description: "Fast-track EASA Part-66 certification for military personnel and experienced technicians.",
};

export default function MilitaryCertPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Military & Industry Certification"
        subtitle="1-Year fast-track for experienced personnel — theory & exams only."
        backgroundImage="/images/hero/military-certification.png"
      />
      <div className="max-w-6xl mx-auto px-6 py-20 space-y-20">

        <SectionReveal>
          <section className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-[#4c9ded] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Fast-Track</span>
                <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Theory Only</span>
              </div>
              <h2 className="text-3xl font-black text-[#002a5c] uppercase tracking-tight mb-6">Certify Your Experience</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-4">
                Designed specifically for military personnel or technicians with <strong>5+ years of verifiable aircraft maintenance experience</strong> who lack EASA certification.
              </p>
              <p className="text-slate-600 leading-relaxed">
                This fast-track course is a strictly theoretical intensive program aimed at preparing students to pass all their EASA exams. It allows experienced technicians to certify their skills without repeating practical training they have already mastered in the field.
              </p>
            </div>

            <div className="bg-[#002a5c] p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-white">
              <Shield className="w-10 h-10 text-[#4c9ded] mb-4" />
              <h3 className="font-bold text-lg mb-4">Program Details</h3>
              <ul className="space-y-4">
                {[
                  { label: "Duration", value: "12 Months" },
                  { label: "Schedule", value: "16:00 – 19:00 Mon–Fri" },
                  { label: "Type", value: "Theory & Exams Only" },
                  { label: "Pricing", value: "Subsidized for military" },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between border-b border-white/10 pb-3 text-sm">
                    <span className="text-blue-100">{item.label}</span>
                    <span className="font-bold text-white">{item.value}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center bg-[#4c9ded] text-white mt-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-[#002a5c] transition-all">
                Apply for Fast-Track
              </Link>
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="bg-slate-50 p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-slate-100">
            <h3 className="text-xl font-bold text-[#002a5c] mb-6">What's Included</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "All B1.1 theory modules & EASA examinations",
                "Guidance on EASA Part 66 License application process",
                "Eligibility for work experience at Aerojet Part 145 Facility",
                "All technical training notes & study materials",
                "Tuition and examination fees included",
                "Special subsidized pricing for military personnel",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-orange-900 block mb-1">Important Note</strong>
              <p className="text-sm text-orange-800 leading-relaxed">
                This program is <strong>strictly theoretical</strong> — it does not include hand-skills training or practical maintenance experience. Candidates must have existing verifiable experience to qualify.
              </p>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <div className="bg-gradient-to-r from-[#002a5c] to-[#4c9ded] p-8 sm:p-12 rounded-2xl sm:rounded-3xl text-center text-white">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Questions About Eligibility?</h2>
            <p className="text-blue-100/80 mb-8 max-w-xl mx-auto">Contact our admissions team to verify your experience qualifies for the fast-track program.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-block bg-white text-[#002a5c] px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all">
                Register Now
              </Link>
              <Link href="/contact" className="inline-block bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all">
                Contact Admissions
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}