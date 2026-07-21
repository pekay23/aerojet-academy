import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'

export const metadata: Metadata = {
  title: 'Module Requirements ',
  description: 'Complete EASA Part-66 module syllabus and licence pathway mapping.',
}

const modules = [
  { id: 'M1', title: 'Mathematics', cat: 'Core' },
  { id: 'M2', title: 'Physics', cat: 'Core' },
  { id: 'M3', title: 'Electrical Fundamentals', cat: 'Core' },
  { id: 'M4', title: 'Electronic Fundamentals', cat: 'Core' },
  { id: 'M5', title: 'Digital Techniques / Electronic Instrument Systems', cat: 'Core' },
  { id: 'M6', title: 'Materials & Hardware', cat: 'Core' },
  { id: 'M7', title: 'Maintenance Practices', cat: 'Core' },
  { id: 'M8', title: 'Basic Aerodynamics', cat: 'Core' },
  { id: 'M9', title: 'Human Factors', cat: 'Core' },
  { id: 'M10', title: 'Aviation Legislation', cat: 'Core' },
  {
    id: 'M11',
    title: 'Turbine Aeroplane Aerodynamics, Structures & Systems',
    cat: 'B1 Specialist',
  },
  { id: 'M12', title: 'Helicopter Aerodynamics, Structures & Systems', cat: 'B1 Specialist' },
  { id: 'M13', title: 'Aircraft Aerodynamics, Structures & Systems', cat: 'B2 Specialist' },
  { id: 'M14', title: 'Propulsion', cat: 'B2 Specialist' },
  { id: 'M15', title: 'Gas Turbine Engine', cat: 'B1 Specialist' },
  { id: 'M16', title: 'Piston Engine', cat: 'B1 Specialist' },
  { id: 'M17', title: 'Propeller', cat: 'B1 Specialist' },
]

const pathways = [
  { name: 'B1.1', title: 'Aeroplanes Turbine', required: 'M1–M10 + M11, M15 & M17' },
  { name: 'B1.2', title: 'Aeroplanes Piston', required: 'M1–M10 + M11, M16 & M17' },
  { name: 'B1.3', title: 'Helicopters Turbine', required: 'M1–M10 + M12 & M15' },
  { name: 'B1.4', title: 'Helicopters Piston', required: 'M1–M10 + M12 & M16' },
  { name: 'B2', title: 'Avionics', required: 'M1–M10 + M13 & M14' },
]

export default function ModuleRequirementsPage() {
  return (
    <div className="bg-slate-50">
      <Hero
        title="Module Requirements"
        subtitle="The EASA Part-66 knowledge syllabus for B1 and B2 certification."
        backgroundImage="/images/hero/module-requirements.webp"
      />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20">
        {/* Pathways */}
        <SectionReveal>
          <section>
            <div className="mb-14 text-center">
              <h2 className="text-aerojet-blue mb-3 text-3xl font-black tracking-tight uppercase">
                Licence Pathways
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500">
                Identify which modules you need based on your target license category.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pathways.map((p) => (
                <div
                  key={p.name}
                  className="hover:border-aerojet-sky group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-8"
                >
                  <h3 className="text-aerojet-blue group-hover:text-aerojet-sky text-2xl font-black transition-colors">
                    {p.name}
                  </h3>
                  <p className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                    {p.title}
                  </p>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-1 text-xs font-black text-slate-400 uppercase">
                      Required Modules:
                    </p>
                    <p className="font-mono text-sm font-bold text-slate-700">{p.required}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        {/* Full Syllabus */}
        <SectionReveal>
          <section>
            <div className="mb-14 text-center">
              <h2 className="text-aerojet-blue mb-3 text-3xl font-black tracking-tight uppercase">
                Complete Syllabus
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500">
                17 modules covering the full spectrum of aircraft maintenance knowledge.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl sm:rounded-3xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-125 text-left text-sm">
                  <thead className="bg-slate-900 text-xs font-black tracking-[0.15em] text-white uppercase">
                    <tr>
                      <th className="px-6 py-5">Code</th>
                      <th className="px-6 py-5">Subject Matter</th>
                      <th className="px-6 py-5 text-right">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {modules.map((mod) => (
                      <tr key={mod.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="text-aerojet-sky px-6 py-4 text-base font-black">
                          {mod.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{mod.title}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${mod.cat === 'Core' ? 'border-slate-200 text-slate-400' : 'text-aerojet-blue border-blue-100 bg-blue-50'}`}
                          >
                            {mod.cat}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* CTA */}
        <SectionReveal>
          <section className="rounded-2xl bg-slate-900 p-8 text-center text-white shadow-2xl sm:rounded-3xl sm:p-12">
            <h2 className="mb-4 text-2xl font-black tracking-tight uppercase sm:text-3xl">
              Ready to Begin Your Modules?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-400">
              Register today to access learning materials, book tuition, and reserve exam seats.
            </p>
            <Link
              href="/register"
              className="bg-aerojet-sky hover:text-aerojet-blue inline-block rounded-xl px-10 py-4 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-white active:scale-[0.98]"
            >
              Start Registration
            </Link>
          </section>
        </SectionReveal>
      </div>
    </div>
  )
}
