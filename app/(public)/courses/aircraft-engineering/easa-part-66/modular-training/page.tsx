import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'
import { CheckCircle2, Calendar, MonitorPlay, Users, AlertCircle, BookOpen } from 'lucide-react'
import ModuleGrid from '@/app/(public)/_components/ModuleGrid'

export const metadata: Metadata = {
  title: 'Modular Training Program ',
  description:
    'Flexible EASA Part-66 modular training — study at your own pace with expert tuition support.',
}

// Data arrays with 'hours' mapped to 'info'
const coreModules = [
  { code: 'M1', name: 'Mathematics', info: '20 Tuition Hours' },
  { code: 'M2', name: 'Physics', info: '20 Tuition Hours' },
  { code: 'M3', name: 'Basic Electricals', info: '24 Tuition Hours' },
  { code: 'M4', name: 'Basic Electronics', info: '20 Tuition Hours' },
  { code: 'M5', name: 'Digital Techniques', info: '24 Tuition Hours' },
  { code: 'M6', name: 'Materials & Hardware', info: '25 Tuition Hours' },
  { code: 'M7', name: 'Maintenance Practices (MCQ)', info: '15 Tuition Hours' },
  { code: 'M8', name: 'Basic Aerodynamics', info: '15 Tuition Hours' },
  { code: 'M9', name: 'Human Factors', info: '15 Tuition Hours' },
  { code: 'M10', name: 'Aviation Legislation (MCQ)', info: '15 Tuition Hours' },
]

const specialistModules = [
  {
    code: 'M11',
    name: 'Turbine Aeroplane Aerodynamics & Systems/Structures',
    info: '25 Tuition Hours',
  },
  { code: 'M15', name: 'Turbine Engines', info: '25 Tuition Hours' },
  { code: 'M17', name: 'Propellers', info: '15 Tuition Hours' },
  {
    code: 'M12',
    name: 'Helicopter Aerodynamics, Structures & Systems',
    info: '25 Tuition Hours',
  },
  { code: 'M16', name: 'Piston Engine', info: '25 Tuition Hours' },
]

const avionicsModules = [
  {
    code: 'M13',
    name: 'Aircraft Aerodynamics, Structures & Systems (Avionics)',
    info: '25 Tuition Hours',
  },
  { code: 'M14', name: 'Propulsion', info: '15 Tuition Hours' },
]

export default function ModularTrainingPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Modular Training"
        subtitle="Study at your own pace — book individual EASA B1 or B2 modules to fit your schedule."
        backgroundImage="/images/hero/modular.webp"
      />
      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        {/* Intro + Who Is It For */}
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <SectionReveal>
              <section>
                <h2 className="text-public-primary mb-8 text-3xl font-black tracking-tight uppercase md:text-4xl">
                  Flexibility & Focus
                </h2>
                <p className="mb-6 text-xl leading-relaxed text-slate-700">
                  This course option allows for a bit more flexibility than the rigorous full-time
                  training program. With the modular training program, you can{' '}
                  <strong>study at your own pace</strong> by booking any of the EASA B1 or B2
                  Modules.
                </p>
                <p className="text-lg leading-relaxed text-slate-600">
                  Once you choose a selected course in the student portal, you will receive the
                  corresponding learning materials and be able to book the most convenient tuition
                  and exam dates using the scheduled slots available.
                </p>
              </section>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8">
                <h4 className="text-public-primary mb-5 flex items-center gap-3 text-lg font-bold">
                  <Users className="text-public-secondary h-6 w-6" /> Who is this for?
                </h4>
                <ul className="space-y-4 text-base text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-public-secondary mt-0.5 h-6 w-6 shrink-0" />
                    <span>
                      Candidates working full-time who want to pursue aircraft maintenance while
                      still working.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-public-secondary mt-0.5 h-6 w-6 shrink-0" />
                    <span>
                      Non-licensed mechanics working with an airline looking to obtain their EASA
                      license.
                    </span>
                  </li>
                </ul>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: Calendar,
                    title: 'Flexible Tuition Slots',
                    desc: 'Morning (10:30–12:30) and afternoon (16:00–19:00) sessions available.',
                  },
                  {
                    icon: MonitorPlay,
                    title: 'Exam Prep Sessions',
                    desc: '2–3 hour pre-exam brush-up sessions right before each exam for every module.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                  >
                    <Icon className="text-public-primary mb-4 h-8 w-8" />
                    <h5 className="mb-2 text-lg font-bold text-slate-900">{title}</h5>
                    <p className="text-base leading-relaxed text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </SectionReveal>
            <SectionReveal>
              <div className="flex items-start gap-5 rounded-2xl border border-orange-100 bg-orange-50 p-6 sm:p-8">
                <AlertCircle className="mt-0.5 h-8 w-8 shrink-0 text-orange-600" />
                <div>
                  <strong className="mb-2 block text-lg text-orange-900">Important Note</strong>
                  <p className="text-base leading-relaxed text-orange-800">
                    This modular program does <strong>NOT</strong> come with work experience or
                    practical training. Candidates must meet the EASA experience requirements
                    independently.
                  </p>
                </div>
              </div>
            </SectionReveal>
          </div>
          {/* Sidebar */}
          <SectionReveal delay={0.2}>
            <div className="space-y-6">
              <div className="bg-public-primary rounded-3xl p-8 text-white shadow-xl sm:p-10">
                <span className="text-sm font-black tracking-widest text-blue-200 uppercase">
                  Portal Access
                </span>
                <div className="mt-3 text-4xl font-black">Lifetime</div>
                <p className="mt-5 mb-8 text-base leading-relaxed text-blue-100/80">
                  One-time registration gives you lifetime access to buy and book as many training
                  modules as you wish.
                </p>
                <Link
                  href="/register"
                  className="bg-public-secondary hover:text-public-primary block w-full rounded-xl py-4 text-center text-sm font-black tracking-widest text-white uppercase transition-all hover:bg-white"
                >
                  Register Now
                </Link>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <h4 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-900">
                  <BookOpen className="text-public-primary h-6 w-6" /> Each Module Includes
                </h4>
                <ul className="space-y-3 text-base text-slate-700">
                  {[
                    'Comprehensive classroom tuition',
                    'Official EASA examination fee sitting',
                    'Expert instruction',
                    'All study materials',
                    'Exam preparation guidance',
                    'Flexible scheduling',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="text-public-secondary mt-0.5 h-5 w-5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionReveal>
        </div>

        {/* Module Grids */}
        <SectionReveal>
          <section className="space-y-16">
            <div>
              <h3 className="text-aerojet-blue mb-8 text-3xl font-bold">Core Modules</h3>
              <ModuleGrid modules={coreModules} />
            </div>
            <div>
              <h3 className="text-aerojet-blue mb-8 text-3xl font-bold">Specialist Modules</h3>
              <ModuleGrid modules={specialistModules} />
            </div>
            <div>
              <h3 className="text-aerojet-blue mb-8 text-3xl font-bold">Avionics Modules</h3>
              <ModuleGrid modules={avionicsModules} />
            </div>
            <div className="mt-6 text-center text-base text-slate-600">
              <p>
                All module pricing is available exclusively in the student portal after
                registration.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* Payment Terms */}
        <SectionReveal>
          <section className="rounded-3xl bg-slate-900 p-8 text-white sm:p-12">
            <h3 className="mb-6 text-2xl font-bold">Payment Terms</h3>
            <div className="space-y-4 text-base">
              {[
                {
                  bold: '100% upfront payment',
                  text: 'required before starting your selected module(s).',
                },
                {
                  bold: 'Package deals available',
                  text: '— contact us for savings on multiple module bookings.',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <CheckCircle2 className="text-public-secondary mt-0.5 h-6 w-6 shrink-0" />
                  <p className="leading-relaxed text-blue-100">
                    <strong className="text-white">{item.bold}</strong> {item.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-white/10 pt-8">
              <p className="text-base leading-relaxed text-blue-100">
                <strong className="text-white">Payment Methods:</strong> Electronic payments (Visa,
                Mobile Money), Bank Transfer, or Cheque. Bank charges borne by student.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="from-public-primary to-public-secondary rounded-3xl bg-linear-to-r p-10 text-center text-white sm:p-16">
            <h2 className="mb-5 text-3xl font-black tracking-tight uppercase md:text-4xl">
              Ready to Book Your Modules?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-blue-100/80">
              Register on our portal to get lifetime access and start booking.
            </p>
            <Link
              href="/register"
              className="text-public-primary inline-block rounded-xl bg-white px-12 py-5 text-sm font-black tracking-widest uppercase transition-all hover:bg-blue-50"
            >
              Register Now
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
