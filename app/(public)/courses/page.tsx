import { Metadata } from "next";
import Link from "next/link";
import { Wrench, GraduationCap, ShieldCheck, CheckCircle2 } from "lucide-react";
import Hero from "../_components/Hero"; // Assuming this is your corrected hero
import SectionReveal from "../_components/SectionReveal";
import CourseComparison from "../_components/CourseComparison";
import CourseListings from "../_components/CourseListings"; // Import the new component

export const metadata: Metadata = {
  title: "Training Programs | Aerojet Academy",
  description: "EASA Part-66 Certified Aircraft Engineering Training — multiple pathways to your career.",
};

export default function CoursesPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Training Programs"
        subtitle="EASA Part-66 certified pathways to a global career in Aircraft Maintenance Engineering."
        backgroundImage="/images/hero/coursespage.webp" // Ensure this path is correct
      />

      {/* Intro Section (As you liked) */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionReveal>
            <span className="text-public-secondary font-bold text-xs uppercase tracking-[0.2em] mb-3 block">EASA Certified</span>
            <h2 className="text-3xl sm:text-4xl font-black text-public-primary uppercase tracking-tight mb-6">
              About Our Training
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              Certified by the European Union Aviation Safety Agency (EASA), our programs prepare you for a career in the Civil Aviation Industry, specifically Aircraft Maintenance Engineering. Students have the opportunity to work on operational commercial aircraft at Aerojet's hangar facility in Ghana or our partner facilities overseas.
            </p>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-public-secondary" /> What does it involve?
              </h3>
              <p className="text-slate-600 mb-4">
                As an aircraft maintenance engineer, your work involves installing, maintaining, replacing, and repairing the airframe, engines, and other components on an aircraft. You may specialise in:
              </p>
              <div className="flex flex-wrap gap-3">
                {["Mechanical Engineering", "Avionics Engineering", "Structures Engineering"].map((s) => (
                  <span key={s} className="inline-flex items-center gap-2 text-sm font-semibold text-public-primary bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> {s}
                  </span>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* NEW Course Listings Section */}
       <section className="relative overflow-hidden py-20 sm:py-28 px-6">
        {/* --- The Gradient Blobs --- */}
        <div 
          className="absolute top-0 left-0 w-[50rem] h-[50rem] bg-public-secondary rounded-full opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <div 
          className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-white rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2"
          aria-hidden="true"
        />

        {/* --- Main Content --- */}
        <div className="relative z-10">
          <CourseListings />
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-16 sm:py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <SectionReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-public-primary uppercase tracking-tight mb-4">Compare Pathways</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">Not sure which programme is right for you? Compare what's included in each pathway.</p>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <CourseComparison />
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Module Requirements Link Section */}
      <SectionReveal>
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-black text-public-primary uppercase tracking-tight mb-4">Need to know which modules to take?</h2>
            <p className="text-slate-500 mb-8 max-w-xl mx-auto">View the complete EASA Part-66 module syllabus and identify your licence pathway requirements.</p>
            <Link href="/courses/module-requirements" className="inline-block bg-public-primary text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-public-secondary transition-colors">
              View Module Requirements
            </Link>
          </div>
        </section>
      </SectionReveal>
      
      {/* Prerequisites Section */}
      <SectionReveal>
        <section className="bg-public-primary py-16 sm:py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-10">Prerequisites</h2>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 text-left">
              {[
                { icon: GraduationCap, title: "Qualifications", text: "SSCE, A-Levels, HND (Math, English, Science) or Bachelor's Degree." },
                { icon: ShieldCheck, title: "Clearance", text: "Medical and security background checks required." },
                { icon: CheckCircle2, title: "Assessment", text: "Aptitude test & Interview after registration." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-public-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{title}</h4>
                    <p className="text-sm text-blue-100/80">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Final CTA Section */}
      <SectionReveal>
        <section className="bg-gradient-to-r from-public-primary to-public-secondary py-16 sm:py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">Ready to Begin?</h2>
            <p className="text-blue-100/80 mb-8 max-w-xl mx-auto">Register today and gain lifetime portal access to book courses, exams, and materials.</p>
            <Link href="/register" className="inline-block bg-white text-public-primary px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all active:scale-[0.98]">
              Register Now
            </Link>
          </div>
        </section>
      </SectionReveal>
    </div>
  );
}
