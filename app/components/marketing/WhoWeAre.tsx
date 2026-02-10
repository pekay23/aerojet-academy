import Image from 'next/image';
import { Award, Briefcase, CheckCircle2, Plane, ShieldCheck } from 'lucide-react';

export default function WhoWeAre() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-6">

        {/* 1. Our Academy */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-aerojet-blue font-bold text-xs uppercase tracking-widest mb-2">
              Our Academy
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-aerojet-blue leading-tight">
              Africa's Foremost Institution in <span className="text-aerojet-sky">Aviation Training</span>
            </h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              Aerojet Aviation Training Academy is a leader in the field of Aviation Training and Engineering.
              Training Engineers for one of the most demanding professions in the world is a truly important
              responsibility that we take very seriously.
            </p>
            <p className="text-slate-600 leading-relaxed">
              At Aerojet, we are extremely committed to educating, mentoring, and preparing aircraft engineers
              to the highest standards. As direct recipients of trained personnel via Aerojet’s Engineering Division,
              we understand the importance of the knowledge and preparation we give to students.
            </p>
            <div className="pt-4 border-t border-slate-100 mt-6">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Training Benefits</p>
              <ul className="grid sm:grid-cols-2 gap-3">
                {['Live Hangar Experience', 'EASA Standards', 'Global Opportunities', 'Hands-on Mentorship'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-aerojet-sky" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative h-[500px] bg-slate-100 rounded-3xl overflow-hidden shadow-2xl skew-x-1 hover:skew-x-0 transition-transform duration-700">
            <Image
              src="/al4.jpeg"
              alt="Aviation Students"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aerojet-blue/80 to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white max-w-xs">
              <p className="font-bold text-xl mb-2">Real World Training</p>
              <p className="text-sm text-blue-100">Gain insight into live aircraft maintenance operations.</p>
            </div>
          </div>
        </div>

        {/* 2. Careers in Aircraft Engineering */}
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-aerojet-sky/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Careers in Aircraft Engineering</h2>
              <p className="text-slate-300 text-lg">
                Aircraft Engineering plays a crucial role in ensuring the safety and efficiency of aircraft travel.
                It is a vital profession with global demand.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                <Briefcase className="w-10 h-10 text-aerojet-sky mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">High Demand & Salary</h3>
                <p className="text-slate-400">
                  Licensed Engineers can earn significant salaries with experience. The demand remains high due to ongoing growth in the aviation industry.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                <Plane className="w-10 h-10 text-aerojet-sky mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Global Opportunities</h3>
                <p className="text-slate-400">
                  Opportunities to work for major airlines and MROs are widely available worldwide. Flexible shift schedules offer good quality of life.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                <ShieldCheck className="w-10 h-10 text-aerojet-sky mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Vital for Safety</h3>
                <p className="text-slate-400">
                  Engineers ensure the safety and reliability of air travel. Planes cannot fly without your expertise and professional diligence.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Understanding Category B & Licensing */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Understanding EASA Licensing</h2>
            <div className="w-20 h-1.5 bg-aerojet-sky mx-auto rounded-full mb-8"></div>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              At Aerojet, we train engineers to EASA Certification standards—the most widely accepted qualification in the industry.
              We focus on the higher-level Category B License.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
              <div className="w-12 h-12 bg-aerojet-blue text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6">B1</div>
              <h3 className="text-2xl font-bold text-aerojet-blue mb-4">Category B1 (Mechanical)</h3>
              <p className="text-slate-700 mb-6">
                Allows the holder to issue certifications of release to service following maintenance, including aircraft structure,
                power plants, and mechanical/electrical systems.
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

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="w-12 h-12 bg-aerojet-sky text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6">B2</div>
              <h3 className="text-2xl font-bold text-aerojet-blue mb-4">Category B2 (Avionics)</h3>
              <p className="text-slate-700 mb-6">
                Specializes in avionics and electrical systems. Covers communication, navigation, radar equipment,
                guidance/control systems, and entertainment systems across all aircraft categories.
              </p>
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2">Key Focus Areas:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-aerojet-sky rounded-full"></div>Electronic Systems</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-aerojet-sky rounded-full"></div>Auto-pilot & Auto-land</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-aerojet-sky rounded-full"></div>Communication & Navigation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-500 max-w-2xl mx-auto italic">
              Note: Aerojet Academy primarily focuses on Category B License training. Category A (Ramp/Line Maintenance)
              maintenance training is provided only on an on-demand basis.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
