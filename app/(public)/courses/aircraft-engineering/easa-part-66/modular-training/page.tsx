import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../../../_components/Hero'
import SectionReveal from '../../../../_components/SectionReveal'
import {
  CheckCircle2,
  Calendar,
  MonitorPlay,
  Users,
  AlertCircle,
  BookOpen,
  Euro,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Modular Training Program | Aerojet Academy',
  description:
    'Flexible EASA Part-66 modular training — study at your own pace with expert tuition support.',
}

// Data arrays with 'price' property removed
const coreModules = [
  { code: 'M1', name: 'Mathematics', hours: 20 },
  { code: 'M2', name: 'Physics', hours: 20 },
  { code: 'M3', name: 'Basic Electricals', hours: 24 },
  { code: 'M4', name: 'Basic Electronics', hours: 20 },
  { code: 'M5', name: 'Digital Techniques', hours: 24 },
  { code: 'M6', name: 'Materials & Hardware', hours: 25 },
  { code: 'M7', name: 'Maintenance Practices (MCQ)', hours: 15 },
  { code: 'M8', name: 'Basic Aerodynamics', hours: 15 },
  { code: 'M9', name: 'Human Factors', hours: 15 },
  { code: 'M10', name: 'Aviation Legislation (MCQ)', hours: 15 },
]

const specialistModules = [
  {
    code: 'M11',
    name: 'Turbine Aeroplane Aerodynamics & Systems/Structures',
    hours: 25,
  },
  { code: 'M15', name: 'Turbine Engines', hours: 25 },
  { code: 'M17', name: 'Propellers', hours: 15 },
  {
    code: 'M12',
    name: 'Helicopter Aerodynamics, Structures & Systems',
    hours: 25,
  },
  { code: 'M16', name: 'Piston Engine', hours: 25 },
]

const avionicsModules = [
  {
    code: 'M13',
    name: 'Aircraft Aerodynamics, Structures & Systems (Avionics)',
    hours: 25,
  },
  { code: 'M14', name: 'Propulsion', hours: 15 },
]

// Table component with the 'Price' column removed
function ModuleTable({
  modules,
  headerColor,
}: {
  modules: { code: string; name: string; hours: number }[]
  headerColor: string
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className={headerColor}>
            <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-white uppercase">
              Code
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-white uppercase">
              Module
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-bold tracking-wider text-white uppercase">
              Tuition Hours
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {modules.map((m, i) => (
            <tr key={m.code} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
              <td className="text-public-secondary px-5 py-3.5 text-sm font-bold">{m.code}</td>
              <td className="px-5 py-3.5 text-sm text-slate-700">{m.name}</td>
              <td className="px-5 py-3.5 text-right text-sm text-slate-500">{m.hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ModularTrainingPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Modular Training"
        subtitle="Study at your own pace — book individual EASA B1 or B2 modules to fit your schedule."
        backgroundImage="/images/hero/modular.webp"
      />
      <div className="mx-auto max-w-6xl space-y-24 px-6 py-20">
        {/* Intro + Who Is It For */}
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <SectionReveal>
              <section>
                <h2 className="text-public-primary mb-6 text-3xl font-black tracking-tight uppercase">
                  Flexibility & Focus
                </h2>
                <p className="mb-4 text-lg leading-relaxed text-slate-700">
                  This course option allows for a bit more flexibility than the rigorous full-time
                  training program. With the modular training program, you can{' '}
                  <strong>study at your own pace</strong> by booking any of the EASA B1 or B2
                  Modules.
                </p>
                <p className="leading-relaxed text-slate-600">
                  Once you choose a selected course in the student portal, you will receive the
                  corresponding learning materials and be able to book the most convenient tuition
                  and exam dates using the scheduled slots available.
                </p>
              </section>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <h4 className="text-public-primary mb-4 flex items-center gap-2 font-bold">
                  <Users className="text-public-secondary h-5 w-5" /> Who is this for?
                </h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-public-secondary mt-0.5 h-5 w-5 shrink-0" />
                    <span>
                      Candidates working full-time who want to pursue aircraft maintenance while
                      still working.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-public-secondary mt-0.5 h-5 w-5 shrink-0" />
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
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <Icon className="text-public-primary mb-3 h-6 w-6" />
                    <h5 className="mb-2 font-bold text-slate-900">{title}</h5>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </SectionReveal>
            <SectionReveal>
              <div className="flex items-start gap-4 rounded-xl border border-orange-100 bg-orange-50 p-5">
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-orange-600" />
                <div>
                  <strong className="mb-1 block text-orange-900">Important Note</strong>
                  <p className="text-sm leading-relaxed text-orange-800">
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
              <div className="bg-public-primary rounded-2xl p-6 text-white shadow-xl sm:rounded-3xl sm:p-8">
                <span className="text-[10px] font-black tracking-widest text-blue-200 uppercase">
                  Portal Access
                </span>
                <div className="mt-2 text-3xl font-black">Lifetime</div>
                <p className="mt-4 mb-6 text-sm text-blue-100/80">
                  One-time registration gives you lifetime access to buy and book as many training
                  modules as you wish.
                </p>
                <Link
                  href="/register"
                  className="bg-public-secondary hover:text-public-primary block w-full rounded-xl py-3.5 text-center text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-white"
                >
                  Register Now
                </Link>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                  <BookOpen className="text-public-primary h-5 w-5" /> Each Module Includes
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {[
                    'Comprehensive classroom tuition',
                    'Official EASA examination fee sitting',
                    'Expert instruction',
                    'All study materials',
                    'Exam preparation guidance',
                    'Flexible scheduling',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="text-public-secondary h-4 w-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionReveal>
        </div>

        {/* Module Tables */}
        <SectionReveal>
          <section className="space-y-12">
            <div>
              <h3 className="text-public-primary mb-6 text-2xl font-bold">Core Modules</h3>
              <ModuleTable modules={coreModules} headerColor="bg-public-primary" />
            </div>
            <div>
              <h3 className="text-public-primary mb-6 text-2xl font-bold">Specialist Modules</h3>
              <ModuleTable modules={specialistModules} headerColor="bg-green-700" />
            </div>
            <div>
              <h3 className="text-public-primary mb-6 text-2xl font-bold">Avionics Modules</h3>
              <ModuleTable modules={avionicsModules} headerColor="bg-purple-700" />
            </div>
            <div className="mt-4 text-center text-sm text-slate-500">
              <p>
                All module pricing is available exclusively in the student portal after
                registration.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* Payment Terms */}
        <SectionReveal>
          <section className="rounded-2xl bg-slate-900 p-6 text-white sm:rounded-3xl sm:p-10">
            <h3 className="mb-5 text-xl font-bold">Payment Terms</h3>
            <div className="space-y-3 text-sm">
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
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="text-public-secondary mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-blue-100">
                    <strong className="text-white">{item.bold}</strong> {item.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-sm text-blue-100">
                <strong className="text-white">Payment Methods:</strong> Electronic payments (Visa,
                Mobile Money), Bank Transfer, or Cheque. Bank charges borne by student.
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <div className="from-public-primary to-public-secondary rounded-2xl bg-linear-to-r p-8 text-center text-white sm:rounded-3xl sm:p-12">
            <h2 className="mb-4 text-2xl font-black tracking-tight uppercase">
              Ready to Book Your Modules?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-blue-100/80">
              Register on our portal to get lifetime access and start booking.
            </p>
            <Link
              href="/register"
              className="text-public-primary inline-block rounded-xl bg-white px-10 py-4 text-xs font-black tracking-widest uppercase transition-all hover:bg-blue-50"
            >
              Register Now
            </Link>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
