import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/components/marketing/PageHero';
import Link from 'next/link';
import { Wrench, CheckCircle2, ShieldCheck, GraduationCap, BookOpen, Award, Users, FileCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Aircraft Engineering | Aerojet Academy',
    description: 'EASA Part-66 Certified Aircraft Engineering Training in Ghana.',
};

export default function AircraftEngineeringPage() {
    return (
        <main className="bg-white min-h-screen">
            <PageHero
                title="Aircraft Engineering"
                subtitle="Certified by EASA. Leading Aviation Training on the African Continent."
                backgroundImage="/coursespage.jpg"
            />

            <div className="container mx-auto px-6 py-20">

                <div className="grid lg:grid-cols-3 gap-12">

                    {/* LEFT CONTENT (2/3) */}
                    <div className="lg:col-span-2 space-y-20">

                        {/* 1. Intro Section */}
                        <section>
                            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">About the Programme</h2>
                            <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
                                Aerojet Aviation Training Academy, developed as part of the flagship Accra MRO Project, aims to provide
                                aircraft technical training and knowledge to the doorstep of Africans on the continent who may otherwise
                                not have the opportunity to pursue careers in aviation.
                            </p>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Certified by the <strong>European Union Aviation Safety Agency (EASA)</strong>, this course prepares you
                                for a career in the Civil Aviation Industry, specifically <strong>Aircraft Maintenance Engineering</strong>.
                                Because this is an internationally certified course, students have the opportunity to work on operational
                                'Live' commercial aircraft at Aerojet's Hangar Facility in Ghana or Aerojet's partner facilities overseas.
                            </p>

                            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Wrench className="w-6 h-6 text-aerojet-sky" /> What does it involve?
                                </h3>
                                <p className="text-slate-700 mb-6 leading-relaxed">
                                    As an aircraft maintenance engineer, your work involves installing, maintaining, replacing, and repairing
                                    the airframe, engines, and other components on an aircraft. You may specialize in one or more disciplines:
                                    mechanical engineering, avionics engineering, and structures engineering.
                                </p>
                                <p className="text-slate-700 italic border-l-4 border-aerojet-sky pl-4">
                                    "You may work on flight systems on one day and wing or fuselage materials on another."
                                </p>
                            </div>
                        </section>

                        {/* 2. Study Pathways */}
                        <section>
                            <div className="mb-10">
                                <span className="text-aerojet-sky font-bold tracking-widest uppercase text-sm">Choose Your Path</span>
                                <h2 className="text-3xl font-black text-aerojet-blue mt-2">Study Pathways</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Pathway A */}
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all hover:border-aerojet-blue group md:col-span-2">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-aerojet-blue transition-colors">
                                            <GraduationCap className="w-6 h-6 text-aerojet-blue group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">A. Full-Time Training Program</h3>
                                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                                A four-year structured program including 2 years of mandatory experience on live aircraft.
                                                Ideal for those seeking a complete career path with guaranteed job placement upon success.
                                            </p>
                                            <ul className="flex flex-wrap gap-4">
                                                <li className="flex items-center gap-2 text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 text-green-500" /> 4-Year Duration</li>
                                                <li className="flex items-center gap-2 text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 text-green-500" /> Guaranteed Job</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Pathway B */}
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all hover:border-aerojet-blue group">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-aerojet-blue transition-colors">
                                        <BookOpen className="w-5 h-5 text-aerojet-blue group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">B. Modular Training</h3>
                                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                                        Flexible self-paced study. Book individual EASA modules and take exams when ready.
                                    </p>
                                </div>

                                {/* Pathway C */}
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all hover:border-aerojet-blue group">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-aerojet-blue transition-colors">
                                        <FileCheck className="w-5 h-5 text-aerojet-blue group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">C. Exam Only</h3>
                                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                                        For confident self-starters. Includes learning materials and exam booking only.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 3. Detailed Program Information */}
                        <section className="space-y-12">
                            {/* Full Time Detail */}
                            <div>
                                <h3 className="text-2xl font-black text-aerojet-blue mb-6">Program Details</h3>
                                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200">
                                    <span className="inline-block px-3 py-1 bg-aerojet-blue text-white text-xs font-bold uppercase tracking-wider rounded-md mb-4">Flagship</span>
                                    <h4 className="text-xl font-bold text-slate-900 mb-4">Four-Year EASA Full-Time Program</h4>
                                    <p className="text-slate-700 mb-6 leading-relaxed text-sm">
                                        This is an Aerojet Engineering initiated structured training program. It includes engineering practical hand-skills training
                                        as well as the EASA Mandatory Live Aircraft Environment/Experience Training in an EASA certified Part 145 Maintenance Facility.
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-sm mb-2">Key Benefits:</h5>
                                            <ul className="space-y-2 text-sm text-slate-700">
                                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-aerojet-sky mt-0.5" /> EASA License application support</li>
                                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-aerojet-sky mt-0.5" /> Job offer upon success</li>
                                                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-aerojet-sky mt-0.5" /> Scholarship opportunities</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-sm mb-2">Schedule:</h5>
                                            <p className="text-sm text-slate-600">08:00 – 15:00 daily, Mon-Fri</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Military Detail */}
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-aerojet-sky text-white text-xs font-bold uppercase tracking-wider rounded-md mb-4">Fast Track</span>
                                    <h4 className="text-xl font-bold text-white mb-4">Military Certification Program (1 Year)</h4>
                                    <p className="text-slate-300 mb-6 leading-relaxed text-sm max-w-2xl">
                                        Designed specifically for Military personnel with at least 5 years of verifiable aircraft maintenance experience.
                                        This fast-track strictly theoretical intensive program prepares students to pass all EASA exams.
                                    </p>
                                    <div className="flex gap-2 text-xs font-medium text-aerojet-sky">
                                        <span>• Subsidized for military</span>
                                        <span>• 16:00 – 19:00 daily</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. License Categories (Kept in main col for width) */}
                        <section>
                            <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Category B Licensing</h2>
                            <p className="text-slate-600 mb-8 max-w-3xl">
                                At Aerojet Academy, our primary focus is training for Category B Licenses, which cover different aircraft types
                                and allow holders to certify complex maintenance work.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-aerojet-blue text-xs">B1.1</div>
                                    <div><div className="font-bold text-sm text-slate-900">Aeroplanes Turbine</div><div className="text-xs text-slate-500">Mechanical</div></div>
                                </div>
                                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-aerojet-blue text-xs">B1.2</div>
                                    <div><div className="font-bold text-sm text-slate-900">Aeroplanes Piston</div><div className="text-xs text-slate-500">Mechanical</div></div>
                                </div>
                                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-aerojet-blue text-xs">B1.3</div>
                                    <div><div className="font-bold text-sm text-slate-900">Helicopters Turbine</div><div className="text-xs text-slate-500">Mechanical</div></div>
                                </div>
                                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-aerojet-blue text-xs">B1.4</div>
                                    <div><div className="font-bold text-sm text-slate-900">Helicopters Piston</div><div className="text-xs text-slate-500">Mechanical</div></div>
                                </div>
                                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 md:col-span-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-aerojet-blue text-xs">B2</div>
                                    <div><div className="font-bold text-sm text-slate-900">Avionics</div><div className="text-xs text-slate-500">All Electronic Systems</div></div>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* RIGHT SIDEBAR (1/3) */}
                    <aside className="space-y-8">

                        {/* Entry Requirements Card */}
                        <div className="bg-aerojet-blue text-white p-8 rounded-3xl shadow-xl">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                <Award className="w-6 h-6 text-aerojet-sky" /> Entry Requirements
                            </h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Qualifications</h4>
                                        <p className="text-blue-100 text-xs mt-1">SSCE, A-Levels, HND/HNC (Math, English, Science) OR Science/Eng Degree.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Aptitude Tests</h4>
                                        <p className="text-blue-100 text-xs mt-1">Online aptitude tests to determine suitability.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Assessment</h4>
                                        <p className="text-blue-100 text-xs mt-1">Face-to-face interview and skill capability assessment.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Important Info / Equipment */}
                        <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-aerojet-blue" /> Good to Know
                            </h3>
                            <div className="space-y-4 text-sm text-slate-600">
                                <div>
                                    <strong className="text-slate-900 block mb-1">Pass Mark:</strong>
                                    Pass of 75% required in each module.
                                </div>
                                <div>
                                    <strong className="text-slate-900 block mb-1">Equipment:</strong>
                                    We provide PPE. You bring stationery & sci-calculator.
                                </div>
                                <div>
                                    <strong className="text-slate-900 block mb-1">Checks:</strong>
                                    Police background check required.
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 text-center">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Ready to Apply?</h2>
                            <p className="text-slate-600 mb-6 text-sm">
                                Create your account on the portal to begin your application process.
                            </p>
                            <Link href="/register" className="inline-flex items-center justify-center gap-2 w-full bg-[#4c9ded] text-white px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-aerojet-blue transition-all">
                                Register Now <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                    </aside>

                </div>

            </div>
        </main>
    );
}
