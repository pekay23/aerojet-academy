import { Metadata } from "next";
import Link from "next/link";
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'

export const metadata: Metadata = {
  title: "Revision Support | Aerojet Academy",
  description: "Intensive 8-week revision series with mock exams — designed for groups and organisations.",
};

export default function RevisionSupportPage() {
  return (
    <div className="bg-white">
      <Hero title="Revision Support" subtitle="Intensive 8-week tuition blocks with mock examinations." backgroundImage="/images/hero/lecture.webp"/>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-24">

        <SectionReveal>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <span className="text-aerojet-sky font-bold text-sm uppercase tracking-[0.2em] mb-4 block">Group Learning</span>
              <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-8 md:text-4xl">8-Week Revision Series</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                Our Revision Support clinics provide focused preparation before EASA examinations. Each series is an 8-session intensive covering core syllabus topics with mock exams at Weeks 4 and 8.
              </p>
              <div className="space-y-4 text-base sm:text-lg text-slate-700">
                {[
                  { label: "Schedule", value: "2:00 PM – 5:00 PM, Monday–Friday" },
                  { label: "Price", value: "Available in the portal" },
                  { label: "Modules", value: "M2, M3, M4, M5, M8 (others on demand)" },
                  { label: "Mock Exams", value: "Week 4 (mid-point) and Week 8 (final)" },
                ].map((item) => (
                  <div key={item.label} className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr] gap-x-4 items-baseline border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="font-bold text-aerojet-blue">{item.label}</span>
                    <span className="text-slate-600">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-6 bg-orange-50 border-l-4 border-orange-400 rounded-r-xl">
                <p className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-2">Individual Student?</p>
                <p className="text-base text-orange-700 leading-relaxed">Please view our <Link href="/courses/aircraft-engineering/easa-part-66/modular-training" className="underline font-bold">Modular Training Programme</Link> which allows individuals to book tuition per module.</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl shadow-xl border-t-4 border-aerojet-sky">
              <h3 className="text-xl font-black uppercase tracking-tight mb-8 text-aerojet-sky">The 8-Week Structure</h3>
              <div className="space-y-6">
                {[
                  { num: "01", title: "Tuition Clinics", desc: "Weekly sessions on core syllabus topics." },
                  { num: "02", title: "Mid-Point Mock", desc: "Full mock exam at Week 4 to assess progress." },
                  { num: "03", title: "Final Mock", desc: "Exam-condition simulation at Week 8." },
                ].map((step) => (
                  <div key={step.num} className="flex gap-5 items-start">
                    <span className="text-4xl font-black text-white/10 mt-1">{step.num}</span>
                    <div>
                      <h4 className="font-bold text-base text-white mb-1">{step.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <div className="text-center">
            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6 md:text-4xl">Corporate & Group Enquiry</h2>
            <p className="text-slate-600 mb-10 max-w-xl mx-auto text-lg leading-relaxed">Representing an organisation? Contact us to discuss scheduling a dedicated revision block for your team.</p>
            <Link href="/contact" className="inline-block bg-aerojet-blue text-white px-12 py-5 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-sky transition-colors">
              Contact Admissions
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}