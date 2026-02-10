import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about Aerojet Aviation Training Academy.',
};

const FAQS = [
  {
    category: "General",
    items: [
      { q: "What is an aviation training school?", a: "An institution that offers education and training for different aviation industry careers." },
      { q: "What types of programs do aviation training schools offer?", a: "Some aviation industry career programs include aircraft maintenance engineering, cabin crew training, pilot training, ground handling, language courses, etc." },
      { q: "Is the training school regulated or accredited?", a: "Yes. Aerojet Academy is an EASA certified center (Part-147). We provide courses for certified qualifications such as the European Aviation Safety Agency (EASA). We also offer proficiency courses certified by IATA and other international bodies." },
      { q: "What are the facilities like?", a: "Aerojet Academy boasts top-class facilities and a learning environment approved by EASA, complying with modern learning technology requirements." },
      { q: "What are the qualifications of Instructors?", a: "All instructors are trained and certified for their chosen subject areas and for their relevant courses. This also applies to our practical assessors and examiners." },
    ]
  },
  {
    category: "Admissions & Enrollment",
    items: [
      { q: "What are the requirements to enroll?", a: "Requirements differ by course. Generally, for Full-Time Engineering, you need SSCE/A-Levels/HND with passes in Math, English, and Science. Specifics are detailed on each course page." },
      { q: "What is the application process?", a: "1. Register on the Portal. 2. Pay the Registration Fee (GHS 350). 3. Complete the Application Form. 4. Wait for Approval. 5. Pay Confirmation Fee. 6. Onboarding." },
      { q: "Are there opportunities for international students?", a: "Yes. Our Academy is open to people from all over the world. International students get access to the same courses and job opportunities at the same cost." },
      { q: "Can I transfer credits from another institution?", a: "No. Because the Academy is a professional certification center (not a traditional university), credits are not transferable. We provide direct job-ready certification." },
      { q: "Is there a trial period?", a: "There is no trial period for any of our courses." },
    ]
  },
  {
    category: "Training & Attendance",
    items: [
      { q: "How long does training take?", a: "It depends on the course. Full-Time Engineering is 4 years (including experience). Modular is self-paced. Exam-Only is just the exam day." },
      { q: "Is there hands-on practical training?", a: "Yes. Most technical courses have a hands-on element. The Full-Time Aircraft Maintenance program has a significantly higher amount of mandatory work experience (2000+ hours) required for EASA certification." },
      { q: "What is the average class size?", a: "Due to our EASA certified status, classes are capped at a maximum of 28 students to ensure quality attention." },
      { q: "What is the attendance policy?", a: "We require more than 90% attendance. Non-compliance could lead to disciplinary action or dismissal, as per safety culture standards." },
      { q: "Do you offer online or part-time options?", a: "Yes. The Modular Program and Exam-Only options allow for self-study and flexibility. Check the 'Training Programs' section for details." },
    ]
  },
  {
    category: "Fees & Finance",
    items: [
      { q: "What are the costs?", a: "Costs vary by course. Full-Time B1.1 is €13,500/year. Exam Seats start at €300. Full pricing is available in the Applicant Portal after registration." },
      { q: "Are scholarships available?", a: "Yes. Scholarships are offered for some careers in collaboration with Aerojet Aviation’s divisions and the Aerojet Foundation. Selection is based on aptitude test performance." },
      { q: "Is there a refund policy?", a: "There is no refund on short courses (≤1 year). For long courses (2+ years), refunds may be issued for an academic year that has not yet started, provided minimum notice is given. See Student Handbook for full policy." },
    ]
  },
  {
    category: "Career & Certification",
    items: [
      { q: "Do you offer a certificate upon completion?", a: "Yes. Certificates are issued for all courses, as well as relevant industry licenses (EASA Part-66) where applicable." },
      { q: "What career opportunities are available?", a: "Aerojet Aviation offers either guaranteed jobs or job placement support with partners worldwide for candidates who successfully complete their programs and maintain good professional behavior." },
      { q: "How do you keep curriculum up-to-date?", a: "To remain an EASA certified center, we strictly adhere to all regulatory updates to training content and exam standards, ensuring full compliance with industry changes." },
    ]
  }
];

export default function FAQPage() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <PageHero 
        title="Frequently Asked Questions" 
        subtitle="Answers to common questions about admissions, training, and careers."
        backgroundImage="/hero-slide2.jpg"
      />

      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="space-y-12">
          {FAQS.map((category, idx) => (
            <div key={idx} className="bg-white rounded-4xl p-8 md:p-12 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-8 border-b border-slate-100 pb-4">
                {category.category}
              </h2>
              
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, i) => (
                  <AccordionItem key={i} value={`item-${idx}-${i}`} className="border-b-slate-100">
                    <AccordionTrigger className="text-left font-bold text-slate-800 hover:text-[#4c9ded] hover:no-underline py-4 text-base md:text-lg">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed text-base pb-6">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-16 text-center">
            <h3 className="text-xl font-bold text-aerojet-blue mb-4">Still have questions?</h3>
            <p className="text-slate-500 mb-8">Can't find the answer you're looking for? Please chat to our friendly team.</p>
            <a href="/contact" className="inline-block bg-aerojet-blue text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-aerojet-sky transition-all shadow-lg">
                Contact Support
            </a>
        </div>
      </div>
    </main>
  );
}
