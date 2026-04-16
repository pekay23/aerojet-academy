"use client";

import SectionReveal from "./SectionReveal";

export default function UnderstandingLicensing() {
  return (
    <SectionReveal>
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="container mx-auto w-full px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-public-primary uppercase tracking-tight mb-4">Understanding EASA Licensing</h2>
            <div className="w-20 h-1.5 bg-public-secondary mx-auto rounded-full mb-8"></div>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              At Aerojet, we train engineers to EASA Certification standards—the most widely accepted qualification in the industry. We focus on the higher-level Category B License.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* B1 Mechanical Card */}
            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
              <div className="w-12 h-12 bg-public-primary text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6">B1</div>
              <h3 className="text-2xl font-bold text-public-primary mb-4">Category B1 (Mechanical)</h3>
              <p className="text-slate-700 mb-6 text-sm leading-relaxed">
                Allows the holder to issue certifications of release to service following maintenance on aircraft structure, power plants, and mechanical/electrical systems. You will be qualified for complex tasks, periodic servicing, and major overhauls.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-all">
                  <span className="font-bold text-slate-800">B1.1</span>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">Aeroplanes Turbine</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-all">
                  <span className="font-bold text-slate-800">B1.2</span>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">Aeroplanes Piston</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-all">
                  <span className="font-bold text-slate-800">B1.3</span>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">Helicopters Turbine</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-all">
                  <span className="font-bold text-slate-800">B1.4</span>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">Helicopters Piston</span>
                </div>
              </div>
            </div>

            {/* B2 Avionics Card */}
            <div className="bg-slate-100 p-8 rounded-3xl border border-slate-200">
              <div className="w-12 h-12 bg-public-secondary text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6">B2</div>
              <h3 className="text-2xl font-bold text-public-primary mb-4">Category B2 (Avionics)</h3>
              <p className="text-slate-700 mb-6 text-sm leading-relaxed">
                Allows the holder to issue certificates of release to service following maintenance on avionic and electrical systems. You will specialize in all electronic systems fitted to aircraft.
              </p>
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-3">Key Focus Areas:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-public-secondary rounded-full"></div>Communication & Navigation</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-public-secondary rounded-full"></div>Radar Equipment</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-public-secondary rounded-full"></div>Guidance & Control Systems</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-public-secondary rounded-full"></div>Auto-pilot & Auto-land</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-public-secondary rounded-full"></div>Cabin Entertainment</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-500 max-w-2xl mx-auto italic text-sm">
              Note: Aerojet Academy primarily focuses on Category B License training. Other license categories may be available on an on-demand basis.
            </p>
          </div>
        </div>
      </section>
    </SectionReveal>
  );
}
