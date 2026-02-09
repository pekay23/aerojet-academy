import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/app/components/marketing/Navbar';
import Footer from '@/app/components/marketing/Footer';
import PageHero from '@/app/components/marketing/PageHero';

export const metadata: Metadata = {
  title: 'Module Requirements',
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

export default function ModulesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">      
      <div className="grow">
        <PageHero 
          title="Module Requirements"
          subtitle="The EASA Part-66 knowledge syllabus for B1 and B2 certification."
          backgroundImage="/courselist.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto space-y-24">

            {/* 1. Pathway Mapping */}
            <section>
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Licence Pathways</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto font-medium">Identify which modules you need based on your target license category.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pathways.map(path => (
                        <div key={path.name} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:border-aerojet-sky transition-all group">
                            <h3 className="text-2xl font-black text-aerojet-blue group-hover:text-aerojet-sky transition-colors">{path.name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{path.title}</p>
                            <div className="pt-4 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Required Modules:</p>
                                <p className="font-mono text-sm text-slate-700 font-bold leading-relaxed">{path.required}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* 2. Full Syllabus Table */}
            <section>
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Complete Syllabus</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto font-medium">A total of 17 modules covering the full spectrum of aircraft maintenance knowledge.</p>
                </div>
                
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm min-w-175">
                            <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-800">
                                <tr>
                                    <th className="px-8 py-6">Code</th>
                                    <th className="px-8 py-6">Subject Matter</th>
                                    <th className="px-8 py-6 text-right">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {modules.map(mod => (
                                    <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-black text-aerojet-sky text-lg">{mod.id}</td>
                                        <td className="px-8 py-5 font-bold text-slate-700">{mod.title}</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                                mod.cat === 'Core' ? 'text-slate-400 border-slate-200' : 'text-aerojet-blue border-blue-100 bg-blue-50'
                                            }`}>
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

             {/* Final CTA */}
            <section className="bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Ready to Begin Your Modules?</h2>
                    <p className="text-slate-400 mb-10 max-w-xl mx-auto font-medium">Register today to view the modular schedule, access learning materials, and book your exam seats.</p>
                    <Link href="/register" className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-white hover:text-aerojet-blue transition-all shadow-lg active:scale-95 inline-block">
                        Start Registration Now
                    </Link>
                </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

