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
import ModuleGrid from '@/app/(public)/_components/ModuleGrid'
import ModuleTabs from './ModuleTabs'
import { getRegistrationConfig } from '@/lib/settings'

export const metadata: Metadata = {
  title: '4-Year Full-Time Program (B1.1 & B2) ',
  description:
    'Comprehensive 4-year EASA Part-66 training with guaranteed job placement upon completion.',
}

const b1Modules = [
  { code: 'M1', name: 'Mathematics' },
  { code: 'M2', name: 'Physics' },
  { code: 'M3', name: 'Electrical Fundamentals' },
  { code: 'M4', name: 'Electronic Fundamentals' },
  { code: 'M5', name: 'Digital Techniques / Avionics' },
  { code: 'M6', name: 'Materials & Hardware' },
  { code: 'M7A', name: 'Maintenance Practices' },
  { code: 'M8', name: 'Basic Aerodynamics' },
  { code: 'M9A', name: 'Human Factors' },
  { code: 'M10', name: 'Aviation Legislation' },
  { code: 'M11A', name: 'Turbine Aeroplane Aerodynamics, Structures & Systems' },
  { code: 'M15', name: 'Gas Turbine Engine' },
  { code: 'M17A', name: 'Propeller' },
]

const b2Modules = [
  { code: 'M1', name: 'Mathematics' },
  { code: 'M2', name: 'Physics' },
  { code: 'M3', name: 'Electrical Fundamentals' },
  { code: 'M4', name: 'Electronic Fundamentals' },
  { code: 'M5', name: 'Digital Techniques / Avionics' },
  { code: 'M6', name: 'Materials & Hardware' },
  { code: 'M7A', name: 'Maintenance Practices' },
  { code: 'M8', name: 'Basic Aerodynamics' },
  { code: 'M9A', name: 'Human Factors' },
  { code: 'M10', name: 'Aviation Legislation' },
  { code: 'M13', name: 'Aircraft Aerodynamics, Structures & Systems (Avionics)' },
  { code: 'M14', name: 'Propulsion' },
]

export default async function FourYearPage() {
  const { isOpen } = await getRegistrationConfig()

  return (
    <div className="bg-white">
      <Hero
        title="4-Year Full-Time Program"
        subtitle="B1.1 & B2 License — The complete pathway to becoming a Licensed Aircraft Engineer."
        backgroundImage="/images/hero/fulltime-b1-b2.webp"
      />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        {/* Intro */}
        <SectionReveal skipInitial>
          <section className="max-w-4xl">
            <div className="mb-8 flex flex-wrap gap-4">
              <span className="bg-aerojet-blue rounded-full px-5 py-2.5 text-sm font-black tracking-widest text-white uppercase">
                Full-Time Training
              </span>
              <span className="text-aerojet-blue rounded-full bg-blue-100 px-5 py-2.5 text-sm font-black tracking-widest uppercase">
                B1.1 & B2 License
              </span>
            </div>
            <h2 className="text-aerojet-blue mb-8 text-3xl font-black tracking-tight md:text-4xl">
              Your Career Starts Here
            </h2>
            <p className="mb-6 text-xl leading-relaxed text-slate-700">
              If you are looking for a career in the Civil Aviation Industry and are interested in
              aircraft maintenance, this is the course for you. You will be working towards one of
              the industry's most widely recognized qualification standards.
            </p>
            <p className="text-lg leading-relaxed text-slate-600">
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
          <section className="rounded-3xl border border-slate-100 bg-slate-50 p-8 sm:p-12">
            <h3 className="text-aerojet-blue mb-6 flex items-center gap-3 text-2xl font-bold">
              <Hammer className="text-aerojet-sky h-6 w-6" /> What Does It Involve?
            </h3>
            <p className="mb-8 text-lg leading-relaxed text-slate-700">
              As an aircraft maintenance engineer, your work involves installing, maintaining,
              replacing and repairing the airframe, engines and other components on an aircraft. You
              may specialise in:
            </p>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {['Mechanical Engineering', 'Avionics Engineering', 'Structures Engineering'].map(
                (s) => (
                  <div
                    key={s}
                    className="text-aerojet-blue rounded-xl border border-slate-200 bg-white px-5 py-4 text-center text-base font-semibold"
                  >
                    {s}
                  </div>
                )
              )}
            </div>
            <p className="border-aerojet-sky border-l-4 pl-5 text-lg text-slate-600 italic">
              "You may work on flight systems on one day and wing or fuselage materials on another."
            </p>
          </section>
        </SectionReveal>

        {/* Guaranteed Job */}
        <SectionReveal>
          <div className="flex items-start gap-5 rounded-3xl border border-green-200 bg-green-50 p-8 sm:p-10">
            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-green-600" />
            <div>
              <h4 className="mb-2 text-xl font-bold text-green-800">Guaranteed Full-Time Job</h4>
              <p className="text-lg text-green-700">
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
              <h4 className="text-aerojet-blue mb-6 flex items-center gap-3 text-xl font-bold">
                <Clock className="text-aerojet-sky h-6 w-6" /> Course Details
              </h4>
              <ul className="space-y-5">
                {[
                  { label: 'Duration', value: '4 years including 2 years hands-on experience' },
                  { label: 'Schedule', value: '08:00 – 15:00 daily, Monday to Friday' },
                  { label: 'Pass Mark', value: '75% and above in each module' },
                  { label: 'Attendance', value: 'More than 90% required' },
                  { label: 'Hands-on Training', value: 'Over 2,000 hours required' },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-4 text-base">
                    <CheckCircle2 className="text-aerojet-sky mt-0.5 h-6 w-6 shrink-0" />
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-aerojet-blue font-bold">{item.label}</span>
                      <span className="text-slate-700">{item.value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div>
              <h4 className="text-aerojet-blue mb-6 flex items-center gap-3 text-xl font-bold">
                <BookOpen className="text-aerojet-sky h-6 w-6" /> What You'll Learn
              </h4>
              <div className="space-y-3">
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
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-base text-slate-700"
                  >
                    <div className="bg-aerojet-sky h-1.5 w-1.5 shrink-0 rounded-full" />
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>

        {/* Technical Modules Breakdown */}
        <SectionReveal>
          <section className="space-y-12">
            <div>
              <h3 className="text-aerojet-blue mb-6 text-3xl font-bold tracking-tight uppercase">
                Technical Modules Breakdown
              </h3>
              <p className="text-lg text-slate-600">
                The 4-year program covers all modules required for both B1.1 (Mechanical) and B2
                (Avionics) EASA categories, providing you with a dual-scope capability that is
                highly valued in the industry.
              </p>
            </div>
            <ModuleTabs b1Modules={b1Modules} b2Modules={b2Modules} />
          </section>
        </SectionReveal>

        {/* What's Provided */}
        <SectionReveal>
          <section className="rounded-3xl border border-blue-100 bg-blue-50 p-8 sm:p-12">
            <h4 className="text-aerojet-blue mb-6 text-xl font-bold">What's Provided</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'All learning materials & study resources',
                'PPE: Boots and uniform/clothing',
                'Expert instruction from qualified instructors',
                'EASA Part 66 License application assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-base text-slate-700">
                  <CheckCircle2 className="text-aerojet-sky h-5 w-5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-500">
              <strong>Note:</strong> Students are required to bring their own pens, notebooks,
              drawing equipment, and scientific calculator.
            </p>
          </section>
        </SectionReveal>

        {/* Admission Process */}
        <SectionReveal>
          <section className="border-aerojet-blue rounded-r-3xl border-l-4 bg-white p-8 shadow-sm sm:p-10">
            <h3 className="mb-10 text-3xl font-bold text-slate-900">How to Apply</h3>
            <div className="max-w-3xl space-y-8">
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
                <div key={i} className="flex gap-5">
                  <div className="bg-aerojet-blue flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="text-aerojet-blue mb-2 text-lg font-bold">{step.title}</h5>
                    <p className="text-base text-slate-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 max-w-3xl rounded-xl border border-green-100 bg-green-50 p-6 sm:p-8">
              <h5 className="mb-3 flex items-center gap-3 text-lg font-bold text-green-800">
                <Award className="h-6 w-6" /> Top 50 Candidates Eligible for Scholarships
              </h5>
              <p className="text-base leading-relaxed text-green-700">
                The top 50 highest-scoring candidates on entry aptitude tests will be selected for
                further assessment. Only 10 full scholarship slots are available each year.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="from-aerojet-blue to-aerojet-sky rounded-3xl bg-linear-to-r p-10 text-center text-white sm:p-16">
            {isOpen ? (
              <>
                <h2 className="mb-5 text-3xl font-black tracking-tight uppercase md:text-4xl">
                  Ready to Apply?
                </h2>
                <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-blue-100/80">
                  Applications are open for the 2026/2027 intake. Secure your place today.
                </p>
                <Link
                  href="/register"
                  className="text-aerojet-blue inline-block rounded-xl bg-white px-12 py-5 text-sm font-black tracking-widest transition-all hover:bg-blue-50 active:scale-[0.98]"
                >
                  Start Registration
                </Link>
              </>
            ) : (
              <>
                <h2 className="mb-5 text-3xl font-black tracking-tight uppercase md:text-4xl">
                  Applications Suspended
                </h2>
                <p className="mx-auto text-lg leading-relaxed text-blue-100/80">
                  No courses are currently running. We will announce when programs restart.
                </p>
              </>
            )}
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
