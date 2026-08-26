import { Metadata } from 'next'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'
import Link from 'next/link'

export const metadata: Metadata = { title: 'FAQ ' }

const FAQS = [
  {
    category: 'General',
    items: [
      {
        q: 'What is an aviation training school?',
        a: 'An institution that offers education and training for different aviation industry careers.',
      },
      {
        q: 'Is the training school regulated or accredited?',
        a: 'Yes. Aerojet Academy is an EASA certified centre (Part-147). We provide courses for certified qualifications such as the European Aviation Safety Agency (EASA).',
      },
      {
        q: 'What are the facilities like?',
        a: 'Aerojet Academy boasts top-class facilities and a learning environment approved by EASA, complying with modern learning technology requirements.',
      },
      {
        q: 'What are the qualifications of instructors?',
        a: 'All instructors are trained and certified for their chosen subject areas and for their relevant courses.',
      },
    ],
  },
  {
    category: 'Admissions & Enrollment',
    items: [
      {
        q: 'What are the requirements to enroll?',
        a: 'Requirements differ by course. Generally, for Full-Time Engineering, you need SSCE/A-Levels/HND with passes in Math, English, and Science.',
      },
      {
        q: 'What is the application process?',
        a: '1. Register on the Portal. 2. Pay the Registration Fee (GHS 350). 3. Complete the Application Form. 4. Wait for Approval. 5. Pay Confirmation Fee. 6. Onboarding.',
      },
      {
        q: 'Are there opportunities for international students?',
        a: 'Yes. Our Academy is open to people from all over the world at the same cost.',
      },
      {
        q: 'Can I transfer credits from another institution?',
        a: 'No. The Academy is a professional certification centre, not a traditional university. We provide direct job-ready certification.',
      },
    ],
  },
  {
    category: 'Training & Attendance',
    items: [
      {
        q: 'How long does training take?',
        a: 'Full-Time Engineering is 4 years (including experience). Modular is self-paced. Exam-Only is just the exam day.',
      },
      {
        q: 'Is there hands-on practical training?',
        a: 'Yes. The Full-Time program has 2,000+ hours of mandatory work experience required for EASA certification.',
      },
      {
        q: 'What is the average class size?',
        a: 'Classes are capped at 28 students to ensure quality attention (EASA certified requirement).',
      },
      {
        q: 'What is the attendance policy?',
        a: 'More than 90% attendance is required. Non-compliance could lead to disciplinary action.',
      },
    ],
  },
  {
    category: 'Fees & Finance',
    items: [
      {
        q: 'What are the costs?',
        a: 'Costs vary by course. Full pricing is available in the Applicant Portal after registration.',
      },
      {
        q: 'Are scholarships available?',
        a: 'Yes. 10 full scholarships annually for top candidates based on aptitude test performance.',
      },
      {
        q: 'Is there a refund policy?',
        a: 'No cash refunds. Short courses (<1 year): can defer. Long courses (2+ years): wallet credit for un-started academic years.',
      },
    ],
  },
  {
    category: 'Career & Certification',
    items: [
      {
        q: 'Do you offer a certificate upon completion?',
        a: 'Yes. Certificates are issued for all courses, as well as EASA Part-66 licenses where applicable.',
      },
      {
        q: 'What career opportunities are available?',
        a: 'Guaranteed jobs or job placement support with partners worldwide for successful graduates.',
      },
      {
        q: 'How do you keep curriculum up-to-date?',
        a: 'We strictly adhere to all EASA regulatory updates to training content and exam standards.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="bg-slate-50">
      <Hero
        title="Frequently Asked Questions"
        subtitle="Answers to common questions about admissions, training, and careers."
        backgroundImage="/images/hero/faq.webp"
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-24 sm:px-6">
        {FAQS.map((category, idx) => (
          <SectionReveal key={idx} delay={idx * 0.05}>
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12">
              <h2 className="text-aerojet-blue mb-8 border-b border-slate-100 pb-5 text-left text-2xl font-black tracking-tight uppercase">
                {category.category}
              </h2>
              <div className="space-y-6">
                {category.items.map((item, i) => (
                  <details key={i} className="group">
                    <summary className="hover:text-aerojet-sky flex w-full cursor-pointer list-none items-start justify-between gap-6 py-3 text-lg font-bold text-slate-800 transition-colors">
                      <span className="flex-1 text-left">{item.q}</span>
                      <span className="text-aerojet-sky mt-0.5 shrink-0 text-2xl leading-none transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 ml-2 border-l-2 border-slate-100 pb-4 pl-4 text-left text-lg leading-relaxed text-slate-600 sm:ml-4 sm:pl-8">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </SectionReveal>
        ))}

        <SectionReveal>
          <div className="mt-12 mb-10 text-center">
            <h3 className="text-aerojet-blue mb-4 text-2xl font-bold">Still have questions?</h3>
            <p className="mb-8 text-lg text-slate-500">
              Can't find the answer you're looking for? Send a message to our friendly team.
            </p>
            <Link
              href="/contact"
              className="bg-aerojet-blue hover:bg-aerojet-sky inline-block rounded-xl px-12 py-5 text-sm font-bold tracking-widest text-white uppercase transition-all"
            >
              Contact Support
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
