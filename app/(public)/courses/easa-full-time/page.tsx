import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import Link from 'next/link';
import { CheckCircle2, Briefcase, GraduationCap, ShieldCheck, Clock, AlertCircle, MapPin, Hammer } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Full-Time EASA Programmes',
  description: 'EASA-standard training pathways: 4-Year Licensed Engineer & 1-Year Experienced/Military Track.',
};

export default function FullTimeCoursesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="grow">
        <PageHero 
          title="Full-Time Programmes"
          subtitle="Immersive, EASA-standard training pathways designed to produce elite Aircraft Maintenance Engineers."
          backgroundImage="/modular.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto space-y-24">
            
            {/* 1. Context / Introduction */}
            <section className="text-center max-w-4xl mx-auto">
                <span className="text-aerojet-sky font-bold tracking-widest uppercase text-xs mb-2 block">Flagship Accra MRO Project</span>
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Aerojet Aviation Training Academy</h2>
                <p className="text-lg text-slate-700 leading-relaxed mb-6">
                    Developed as part of the Aerojet's flagship Accra MRO Project, the Academy aims to provide aircraft technical training and knowledge to the doorstep of Africans on the continent who may otherwise not have the opportunity to pursue careers in aviation.
                </p>
                <p className="text-slate-600">
                    Certified by the <strong>European Union Aviation Safety Agency (EASA)</strong>, our courses prepare you for a career in the Civil Aviation Industry, specifically Aircraft Maintenance Engineering.
                </p>
            </section>

            {/* 2. The 4-Year Programme (PDF Content) */}
            <section className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Briefcase className="w-64 h-64 text-aerojet-blue" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className="bg-aerojet-blue text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Study Pathway A</span>
                        <span className="bg-blue-100 text-aerojet-blue px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">B1.1 & B2 License</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black text-aerojet-bluelue mb-6">4-Year Full-Time Training Program</h3>
                    
                    <div className="prose prose-slate max-w-none text-slate-700 mb-8">
                        <p className="text-lg">
                            If you are looking for a career in the Civil Aviation Industry and are interested in aircraft maintenance, this is the course for you. You will be working towards one of the industry's most widely recognized qualification standards.
                        </p>
                        <p>
                            This four-year program includes a required experience period of <strong>two years working on live operational aircraft</strong> under strict supervision. Because this is an internationally certified course, a student has the opportunity to work on operational 'Live' commercial aircraft at Aerojet's Hangar Facility in Ghana or Aerojet's partner facilities overseas.
                        </p>
                    </div>

                    {/* What does it involve? */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-10">
                        <h4 className="font-bold text-aerojet-blue text-xl mb-4 flex items-center gap-2">
                            <Hammer className="w-5 h-5 text-[#4c9ded]"/> What Does It Involve?
                        </h4>
                        <p className="text-slate-700 mb-6">
                            As an aircraft maintenance engineer, your work involves installing, maintaining, replacing and repairing the air frame, engines and other components on an aircraft. You may specialize in:
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 text-sm font-semibold text-aerojet-blue mb-6">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">Mechanical Engineering</div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">Avionics Engineering</div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">Structures Engineering</div>
                        </div>
                        <p className="text-slate-600 italic border-l-4 border-[#4c9ded] pl-4">
                            "You may work on flight systems on one day and wing or fuselage materials on another."
                        </p>
                    </div>

                    {/* Guaranteed Job */}
                    <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex gap-4 items-start mb-10">
                        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-green-800 text-lg">Guaranteed Full-Time Job</h4>
                            <p className="text-green-700 mt-1">
                                Successful completion of this program will <strong>guarantee you a job</strong> with Aerojet Aviation’s Engineering/MRO division.
                            </p>
                        </div>
                    </div>

                    {/* Detailed Requirements Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-aerojet-bluelue flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-[#4c9ded]"/> Student Requirements
                            </h4>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#4c9ded] font-bold">01.</span>
                                    <span>You will be required to achieve a pass of <strong>75% and above</strong> in each of the relevant modules.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#4c9ded] font-bold">02.</span>
                                    <span>Undergo over <strong>2000 hours</strong> of hands-on training to achieve the required qualification.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#4c9ded] font-bold">03.</span>
                                    <span>Maintain more than <strong>90% attendance</strong> over the period.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#4c9ded] font-bold">04.</span>
                                    <span><strong>PPE:</strong> Aerojet provides boots and uniform/clothing.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#4c9ded] font-bold">05.</span>
                                    <span><strong>Bring your own:</strong> Pens, notebooks, drawing equipment, and a scientific calculator.</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-aerojet-blue flex items-center gap-2 mb-4">
                                <GraduationCap className="w-5 h-5 text-[#4c9ded]"/> Curriculum Highlights
                            </h4>
                            <p className="text-sm text-slate-600 mb-4">
                                During the course, you will learn:
                            </p>
                            <ul className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                                <li className="bg-white px-3 py-2 rounded border border-slate-100 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4c9ded]"></div> Fundamentals of aviation mathematics & science
                                </li>
                                <li className="bg-white px-3 py-2 rounded border border-slate-100 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4c9ded]"></div> Aircraft aerodynamics
                                </li>
                                <li className="bg-white px-3 py-2 rounded border border-slate-100 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4c9ded]"></div> Structures and systems for turbine engines
                                </li>
                                <li className="bg-white px-3 py-2 rounded border border-slate-100 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4c9ded]"></div> Digital Communications
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. The Military / Experienced Track (From User Code) */}
            <section className="relative">
                <div className="bg-aerojet-blue rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                         <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>

                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="bg-[#4c9ded] text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Alternative Track</span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Military / Experienced (1 Year)</h2>
                            <p className="text-blue-100 leading-relaxed mb-6 font-medium">
                                Designed specifically for Military personnel or technicians with <strong>5+ years of verifiable experience</strong> who lack EASA certification. This fast-track course is designed for working professionals needing EASA B1.1 theory & exams only.
                            </p>
                            
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 text-sm text-blue-50">
                                    <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0" />
                                    <span><strong>Includes:</strong> B1.1 Theory Modules & All EASA Examinations.</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-blue-50">
                                    <Clock className="w-5 h-5 text-[#4c9ded] shrink-0" />
                                    <span><strong>Schedule:</strong> Evening & Saturday classes (16:00 – 19:00 Mon-Fri).</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-blue-50">
                                    <AlertCircle className="w-5 h-5 text-[#4c9ded] shrink-0" />
                                    <span><strong>Note:</strong> Strictly theoretical (No hand-skills training).</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                             <h3 className="font-bold text-[#4c9ded] uppercase text-sm tracking-widest mb-4">Fast-Track Details</h3>
                             <p className="text-sm text-blue-100 mb-6 leading-relaxed">
                                This programme allows experienced technicians to certify their skills without repeating the practical training they have already mastered in the field.
                             </p>
                             <ul className="space-y-4 text-sm text-white font-bold">
                                <li className="flex justify-between border-b border-white/10 pb-2">
                                    <span>Duration</span>
                                    <span>12 Months</span>
                                </li>
                                <li className="flex justify-between border-b border-white/10 pb-2">
                                    <span>Work Experience</span>
                                    <span>Eligible for slots upon passing</span>
                                </li>
                             </ul>
                             <Link href="/register" className="block w-full text-center bg-[#4c9ded] text-white mt-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all">
                                Apply for Fast-Track
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Admission Process (PDF Details) */}
            <section className="bg-white border-l-4 border-aerojet-blue p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">Admission & Entry Requirements</h3>
                
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h4 className="font-bold text-sm uppercase text-slate-500 mb-4">Academic Qualifications</h4>
                        <p className="text-slate-700 mb-6">
                            SSCE, A-Levels, HND/HNC with passes in <strong>Mathematics, English, and Science</strong> OR a Bachelor’s Degree in any science, mathematics, or engineering field.
                        </p>
                        
                        <h4 className="font-bold text-sm uppercase text-slate-500 mb-4">Scholarship Opportunities</h4>
                        <p className="text-slate-700">
                            Scholarship opportunities are available for the <strong>best candidates</strong> after the screening process.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-aerojet-blue shrink-0">1</div>
                            <div>
                                <h5 className="font-bold text-aerojet-blue">Aptitude Tests</h5>
                                <p className="text-sm text-slate-600 mt-1">
                                    After registration, you receive a link to complete an online assessment to determine suitability. 
                                    <span className="italic block mt-1 text-xs">Note: Your assessment test may be used to apply for other programs on offer as long as you apply within 6 months.</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-aerojet-blue shrink-0">2</div>
                            <div>
                                <h5 className="font-bold text-aerojet-blue">Face-to-Face Interview</h5>
                                <p className="text-sm text-slate-600 mt-1">
                                    Shortlisted candidates are invited for a face-to-face interview and <strong>skill capability assessment</strong>. This is the final step in the application process.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-aerojet-blue shrink-0">3</div>
                            <div>
                                <h5 className="font-bold text-aerojet-blue">Clearance</h5>
                                <p className="text-sm text-slate-600 mt-1">
                                    Students will be required to complete a police background check and a medical assessment at their own cost.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
