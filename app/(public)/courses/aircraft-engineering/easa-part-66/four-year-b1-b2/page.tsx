import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Briefcase,
  Hammer,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '4-Year Full-Time Program (B1.1 & B2) | Aerojet Academy',
  description:
    'Comprehensive 4-year EASA Part-66 training with guaranteed job placement upon completion.',
}

export default function FourYearPage() {
  return (
    <div className="bg-white">
      <Hero
        title="4-Year Full-Time Program"
        subtitle="B1.1 & B2 License — The complete pathway to becoming a Licensed Aircraft Engineer."
        backgroundImage="/images/hero/fulltime-b1-b2.webp"
      />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        {/* Intro */}
        <SectionReveal>
          <section className="max-w-4xl">
            <div className="mb-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-aerojet-blue px-4 py-2 text-xs font-black tracking-widest text-white uppercase">
                Full-Time Training
              </span>
              <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black tracking-widest text-aerojet-blue uppercase">
                B1.1 & B2 License
              </span>
            </div>
            <h2 className="mb-6 text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl">
              Your Career Starts Here
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-slate-700">
              If you are looking for a career in the Civil Aviation Industry and are interested in
              aircraft maintenance, this is the course for you. You will be working towards one of
              the industry's most widely recognized qualification standards.
            </p>
            <p className="leading-relaxed text-slate-600">
              This four-year program includes a required experience period of{' '}
              <strong>two years working on live operational aircraft</strong> under strict
              supervision. Because this is an internationally certified course, students have the
              opportunity to work on operational commercial aircraft at Aerojet's Hangar Facility in
              Ghana or partner facilities overseas.
            </p>
          </section>
        </SectionReveal>

        {/* What Does It Involve */}
        <SectionReveal>
          <section className="rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:rounded-3xl sm:p-10">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-aerojet-blue">
              <Hammer className="h-5 w-5 text-aerojet-sky" /> What Does It Involve?
            </h3>
            <p className="mb-6 leading-relaxed text-slate-700">
              As an aircraft maintenance engineer, your work involves installing, maintaining,
              replacing and repairing the airframe, engines and other components on an aircraft. You
              may specialise in:
            </p>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {['Mechanical Engineering', 'Avionics Engineering', 'Structures Engineering'].map(
                (s) => (
                  <div
                    key={s}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-aerojet-blue"
                  >
                    {s}
                  </div>
                )
              )}
            </div>
            <p className="border-l-4 border-aerojet-sky pl-4 text-slate-600 italic">
              "You may work on flight systems on one day and wing or fuselage materials on another."
            </p>
          </section>
        </SectionReveal>

        {/* Guaranteed Job */}
        <SectionReveal>
          <div className="flex items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-6 sm:p-8">
            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-green-600" />
            <div>
              <h4 className="mb-1 text-lg font-bold text-green-800">Guaranteed Full-Time Job</h4>
              <p className="text-green-700">
                Successful completion of this program will <strong>guarantee you a job</strong> with
                Aerojet Aviation's Engineering/MRO division.
              </p>
            </div>
          </div>
        </SectionReveal>

        {/* Details Grid */}
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2">
          <SectionReveal>
            <div>
              <h4 className="mb-5 flex items-center gap-2 font-bold text-aerojet-blue">
                <Clock className="h-5 w-5 text-aerojet-sky" /> Course Details
              </h4>
              <ul className="space-y-4">
                {[
                  { label: 'Duration', value: '4 years including 2 years hands-on experience' },
                  { label: 'Schedule', value: '08:00 – 15:00 daily, Monday to Friday' },
                  { label: 'Pass Mark', value: '75% and above in each module' },
                  { label: 'Attendance', value: 'More than 90% required' },
                  { label: 'Hands-on Training', value: 'Over 2,000 hours required' },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-aerojet-sky" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">{item.label}:</strong> {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div>
              <h4 className="mb-5 flex items-center gap-2 font-bold text-aerojet-blue">
                <BookOpen className="h-5 w-5 text-aerojet-sky" /> What You'll Learn
              </h4>
              <div className="space-y-2">
                {[
                  'Fundamentals of aviation mathematics & science',
                  'Aircraft aerodynamics',
                  'Structures and systems for turbine engines',
                  'Digital communications & electronic systems',
                  'Maintenance practices & aviation legislation',
                  'Human factors in aviation',
                ].map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-aerojet-sky" />
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>

        {/* What's Provided */}
        <SectionReveal>
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:rounded-3xl sm:p-10">
            <h4 className="mb-5 font-bold text-aerojet-blue">What's Provided</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'All learning materials & study resources',
                'PPE: Boots and uniform/clothing',
                'Expert instruction from qualified instructors',
                'EASA Part 66 License application assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-aerojet-sky" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-500">
              <strong>Note:</strong> Students are required to bring their own pens, notebooks,
              drawing equipment, and scientific calculator.
            </p>
          </section>
        </SectionReveal>

        {/* Admission Process */}
        <SectionReveal>
          <section className="rounded-r-2xl border-l-4 border-aerojet-blue bg-white p-6 shadow-sm sm:p-8">
            <h3 className="mb-8 text-2xl font-bold text-slate-900">How to Apply</h3>
            <div className="max-w-3xl space-y-6">
              {[
                {
                  title: 'Register on our Portal',
                  desc: 'Pay and register with the Training Academy for lifetime access.',
                },
                {
                  title: 'Complete Aptitude Tests',
                  desc: 'After registration, receive a link to complete online assessment tests.',
                },
                {
                  title: 'Face-to-Face Interview',
                  desc: 'Shortlisted candidates are invited for interview and skill capability assessment.',
                },
                {
                  title: 'Clearance Checks',
                  desc: 'Complete police background check and medical assessment at your own cost.',
                },
                {
                  title: 'Start Your Course',
                  desc: 'Book and make payment for your chosen course and begin your journey!',
                },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aerojet-blue font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="mb-1 font-bold text-aerojet-blue">{step.title}</h5>
                    <p className="text-sm text-slate-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 max-w-3xl rounded-xl border border-green-100 bg-green-50 p-5">
              <h5 className="mb-2 flex items-center gap-2 font-bold text-green-800">
                <Award className="h-5 w-5" /> Top 50 Candidates Eligible for Scholarships
              </h5>
              <p className="text-sm text-green-700">
                The top 50 highest-scoring candidates on entry aptitude tests will be selected for
                further assessment. Only 10 full scholarship slots are available each year.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="rounded-2xl bg-linear-to-r from-aerojet-blue to-aerojet-sky p-8 text-center text-white sm:rounded-3xl sm:p-12">
            <h2 className="mb-4 text-2xl font-black tracking-tight uppercase sm:text-3xl">
              Ready to Apply?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-blue-100/80">
              Applications are open for the 2026/2027 intake. Secure your place today.
            </p>
            <Link
              href="/register"
              className="inline-block rounded-xl bg-white px-10 py-4 text-xs font-black tracking-widest text-aerojet-blue transition-all hover:bg-blue-50 active:scale-[0.98]"
            >
              Start Registration
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
