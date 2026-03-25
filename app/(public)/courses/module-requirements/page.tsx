import { Metadata } from "next";
import Link from "next/link";
import Hero from "../../_components/Hero";
import SectionReveal from "../../_components/SectionReveal";

export const metadata: Metadata = {
  title: "Module Requirements | Aerojet Academy",
  description: "Complete EASA Part-66 module syllabus and licence pathway mapping.",
};

const modules = [
  { id: "M1", title: "Mathematics", cat: "Core" },
  { id: "M2", title: "Physics", cat: "Core" },
  { id: "M3", title: "Electrical Fundamentals", cat: "Core" },
  { id: "M4", title: "Electronic Fundamentals", cat: "Core" },
  { id: "M5", title: "Digital Techniques / Electronic Instrument Systems", cat: "Core" },
  { id: "M6", title: "Materials & Hardware", cat: "Core" },
  { id: "M7", title: "Maintenance Practices", cat: "Core" },
  { id: "M8", title: "Basic Aerodynamics", cat: "Core" },
  { id: "M9", title: "Human Factors", cat: "Core" },
  { id: "M10", title: "Aviation Legislation", cat: "Core" },
  { id: "M11", title: "Turbine Aeroplane Aerodynamics, Structures & Systems", cat: "B1 Specialist" },
  { id: "M12", title: "Helicopter Aerodynamics, Structures & Systems", cat: "B1 Specialist" },
  { id: "M13", title: "Aircraft Aerodynamics, Structures & Systems", cat: "B2 Specialist" },
  { id: "M14", title: "Propulsion", cat: "B2 Specialist" },
  { id: "M15", title: "Gas Turbine Engine", cat: "B1 Specialist" },
  { id: "M16", title: "Piston Engine", cat: "B1 Specialist" },
  { id: "M17", title: "Propeller", cat: "B1 Specialist" },
];

const pathways = [
  { name: "B1.1", title: "Aeroplanes Turbine", required: "M1–M10 + M11, M15 & M17" },
  { name: "B1.2", title: "Aeroplanes Piston", required: "M1–M10 + M11, M16 & M17" },
  { name: "B1.3", title: "Helicopters Turbine", required: "M1–M10 + M12 & M15" },
  { name: "B1.4", title: "Helicopters Piston", required: "M1–M10 + M12 & M16" },
  { name: "B2", title: "Avionics", required: "M1–M10 + M13 & M14" },
];

export default function ModuleRequirementsPage() {
  return (
    <div className="bg-slate-50">
      <Hero title="Module Requirements" subtitle="The EASA Part-66 knowledge syllabus for B1 and B2 certification." backgroundImage="/images/hero/module-requirements.webp" />

      <div className="max-w-6xl mx-auto px-6 py-20 space-y-24">

        {/* Pathways */}
        <SectionReveal>
          <section>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-3">Licence Pathways</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">Identify which modules you need based on your target license category.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pathways.map((p) => (
                <div key={p.name} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm hover:border-aerojet-sky transition-all group">
                  <h3 className="text-2xl font-black text-aerojet-blue group-hover:text-aerojet-sky transition-colors">{p.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{p.title}</p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Required Modules:</p>
                    <p className="font-mono text-sm text-slate-700 font-bold">{p.required}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        {/* Full Syllabus */}
        <SectionReveal>
          <section>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-3">Complete Syllabus</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">17 modules covering the full spectrum of aircraft maintenance knowledge.</p>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.15em]">
                    <tr>
                      <th className="px-6 py-5">Code</th>
                      <th className="px-6 py-5">Subject Matter</th>
                      <th className="px-6 py-5 text-right">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {modules.map((mod) => (
                      <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-black text-aerojet-sky text-base">{mod.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{mod.title}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${mod.cat === "Core" ? "text-slate-400 border-slate-200" : "text-aerojet-blue border-blue-100 bg-blue-50"}`}>
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
          <section className="bg-slate-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4">Ready to Begin Your Modules?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">Register today to access learning materials, book tuition, and reserve exam seats.</p>
            <Link href="/register" className="inline-block bg-aerojet-sky text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all active:scale-[0.98]">
              Start Registration
            </Link>
          </section>
        </SectionReveal>
      </div>
    </div>
  );
}