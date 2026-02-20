import { Metadata } from "next";
import Hero from "../../_components/Hero";
import SectionReveal from "../../_components/SectionReveal";
import Link from "next/link";

export const metadata: Metadata = { title: "FAQ | Aerojet Academy" };

const FAQS = [
  {
    category: "General",
    items: [
      { q: "What is an aviation training school?", a: "An institution that offers education and training for different aviation industry careers." },
      { q: "Is the training school regulated or accredited?", a: "Yes. Aerojet Academy is an EASA certified centre (Part-147). We provide courses for certified qualifications such as the European Aviation Safety Agency (EASA)." },
      { q: "What are the facilities like?", a: "Aerojet Academy boasts top-class facilities and a learning environment approved by EASA, complying with modern learning technology requirements." },
      { q: "What are the qualifications of instructors?", a: "All instructors are trained and certified for their chosen subject areas and for their relevant courses." },
    ],
  },
  {
    category: "Admissions & Enrollment",
    items: [
      { q: "What are the requirements to enroll?", a: "Requirements differ by course. Generally, for Full-Time Engineering, you need SSCE/A-Levels/HND with passes in Math, English, and Science." },
      { q: "What is the application process?", a: "1. Register on the Portal. 2. Pay the Registration Fee (GHS 350). 3. Complete the Application Form. 4. Wait for Approval. 5. Pay Confirmation Fee. 6. Onboarding." },
      { q: "Are there opportunities for international students?", a: "Yes. Our Academy is open to people from all over the world at the same cost." },
      { q: "Can I transfer credits from another institution?", a: "No. The Academy is a professional certification centre, not a traditional university. We provide direct job-ready certification." },
    ],
  },
  {
    category: "Training & Attendance",
    items: [
      { q: "How long does training take?", a: "Full-Time Engineering is 4 years (including experience). Modular is self-paced. Exam-Only is just the exam day." },
      { q: "Is there hands-on practical training?", a: "Yes. The Full-Time program has 2,000+ hours of mandatory work experience required for EASA certification." },
      { q: "What is the average class size?", a: "Classes are capped at 28 students to ensure quality attention (EASA certified requirement)." },
      { q: "What is the attendance policy?", a: "More than 90% attendance is required. Non-compliance could lead to disciplinary action." },
    ],
  },
  {
    category: "Fees & Finance",
    items: [
      { q: "What are the costs?", a: "Costs vary by course. Exam Seats start at €300. Full pricing is available in the Applicant Portal after registration." },
      { q: "Are scholarships available?", a: "Yes. 10 full scholarships annually for top candidates based on aptitude test performance." },
      { q: "Is there a refund policy?", a: "No cash refunds. Short courses (<1 year): can defer. Long courses (2+ years): wallet credit for un-started academic years." },
    ],
  },
  {
    category: "Career & Certification",
    items: [
      { q: "Do you offer a certificate upon completion?", a: "Yes. Certificates are issued for all courses, as well as EASA Part-66 licenses where applicable." },
      { q: "What career opportunities are available?", a: "Guaranteed jobs or job placement support with partners worldwide for successful graduates." },
      { q: "How do you keep curriculum up-to-date?", a: "We strictly adhere to all EASA regulatory updates to training content and exam standards." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="bg-slate-50">
      <Hero title="Frequently Asked Questions" subtitle="Answers to common questions about admissions, training, and careers." backgroundImage="/images/hero/faq.png"/>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 space-y-10">
        {FAQS.map((category, idx) => (
          <SectionReveal key={idx} delay={idx * 0.05}>
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100">
              <h2 className="text-xl font-black text-[#002a5c] uppercase tracking-tight mb-6 border-b border-slate-100 pb-4">
                {category.category}
              </h2>
              <div className="space-y-6">
                {category.items.map((item, i) => (
                  <details key={i} className="group">
                    <summary className="cursor-pointer font-bold text-slate-800 hover:text-[#4c9ded] transition-colors py-2 text-base flex items-start justify-between gap-4 list-none">
                      <span>{item.q}</span>
                      <span className="text-[#4c9ded] text-xl leading-none shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
                    </summary>
                    <p className="text-slate-600 leading-relaxed pb-2 pl-0 text-sm mt-1">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </SectionReveal>
        ))}

        <SectionReveal>
          <div className="text-center mt-8">
            <h3 className="text-lg font-bold text-[#002a5c] mb-3">Still have questions?</h3>
            <p className="text-slate-500 mb-6 text-sm">Can't find the answer you're looking for? Chat to our friendly team.</p>
            <Link href="/contact" className="inline-block bg-[#002a5c] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#4c9ded] transition-all">
              Contact Support
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}