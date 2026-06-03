'use client'

import SectionReveal from './SectionReveal'

export default function UnderstandingLicensing() {
  return (
    <SectionReveal>
      <section className="bg-paper py-20 sm:py-28">
        <div className="container mx-auto w-full px-6">
          <div className="mb-16 text-center">
            <h2 className="text-aerojet-blue mb-4 font-serif text-3xl font-medium">
              Understanding EASA Licensing
            </h2>
            <div className="mx-auto mb-8 h-px w-20 bg-[#1b2430]/20"></div>
            <p className="mx-auto max-w-3xl text-lg text-[#1b2430]/70">
              At Aerojet, we train engineers to EASA Certification standards—the most widely
              accepted qualification in the industry. We focus on the higher-level Category B
              License.
            </p>
          </div>

          <div className="mb-16 grid gap-8 md:grid-cols-2">
            {/* B1 Mechanical Card */}
            <div className="bg-paper-dark relative border border-[#1b2430]/15 p-8">
              <div className="text-aerojet-blue mb-4 font-serif text-3xl font-medium">
                B1 <span className="ml-2 text-lg text-[#1b2430]/60">Mechanical</span>
              </div>
              <p className="mb-6 border-b border-[#1b2430]/15 pb-6 text-sm leading-relaxed text-[#1b2430]/70">
                Allows the holder to issue certifications of release to service following
                maintenance on aircraft structure, power plants, and mechanical/electrical systems.
                You will be qualified for complex tasks, periodic servicing, and major overhauls.
              </p>
              <div className="divide-y divide-[#1b2430]/15">
                <div className="flex items-center justify-between py-3">
                  <span className="text-aerojet-blue font-bold">B1.1</span>
                  <span className="text-sm text-[10px] font-bold tracking-wider text-[#1b2430]/60 uppercase">
                    Aeroplanes Turbine
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-aerojet-blue font-bold">B1.2</span>
                  <span className="text-sm text-[10px] font-bold tracking-wider text-[#1b2430]/60 uppercase">
                    Aeroplanes Piston
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-aerojet-blue font-bold">B1.3</span>
                  <span className="text-sm text-[10px] font-bold tracking-wider text-[#1b2430]/60 uppercase">
                    Helicopters Turbine
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-aerojet-blue font-bold">B1.4</span>
                  <span className="text-sm text-[10px] font-bold tracking-wider text-[#1b2430]/60 uppercase">
                    Helicopters Piston
                  </span>
                </div>
              </div>
            </div>

            {/* B2 Avionics Card */}
            <div className="bg-paper-dark relative border border-[#1b2430]/15 p-8">
              <div className="text-aerojet-blue mb-4 font-serif text-3xl font-medium">
                B2 <span className="ml-2 text-lg text-[#1b2430]/60">Avionics</span>
              </div>
              <p className="mb-6 border-b border-[#1b2430]/15 pb-6 text-sm leading-relaxed text-[#1b2430]/70">
                Allows the holder to issue certificates of release to service following maintenance
                on avionic and electrical systems. You will specialize in all electronic systems
                fitted to aircraft.
              </p>
              <div className="pt-2">
                <h4 className="mb-4 text-xs font-bold tracking-widest text-[#1b2430] uppercase">
                  Key Focus Areas:
                </h4>
                <ul className="space-y-3 text-sm text-[#1b2430]/70">
                  <li className="flex items-center gap-3">
                    <span className="text-aerojet-blue/40">✦</span> Communication & Navigation
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-aerojet-blue/40">✦</span> Radar Equipment
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-aerojet-blue/40">✦</span> Guidance & Control Systems
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-aerojet-blue/40">✦</span> Auto-pilot & Auto-land
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-aerojet-blue/40">✦</span> Cabin Entertainment
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="mx-auto max-w-2xl text-sm text-slate-500 italic">
              Note: Aerojet Academy primarily focuses on Category B License training. Other license
              categories may be available on an on-demand basis.
            </p>
          </div>
        </div>
      </section>
    </SectionReveal>
  )
}
