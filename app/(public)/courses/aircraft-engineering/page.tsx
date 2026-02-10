import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import Link from 'next/link';
import { Wrench, CheckCircle2, ShieldCheck, GraduationCap, BookOpen, Award, Users } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Aircraft Engineering | Aerojet Academy',
    description: 'EASA Part-66 Certified Aircraft Engineering Training in Ghana. Prepare for a global career in Civil Aviation.',
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

                {/* Intro Section */}
                <section className="max-w-4xl mx-auto mb-20">
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">About the Programme</h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                        Aerojet Aviation Training Academy, developed as part of the flagship Accra MRO Project, aims to provide
                        aircraft technical training and knowledge to the doorstep of Africans on the continent who may otherwise
                        not have the opportunity to pursue careers in aviation.
                    </p>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                        Certified by the <strong>European Union Aviation Safety Agency (EASA)</strong>, this course prepares you
                        for a career in the Civil Aviation Industry, specifically <strong>Aircraft Maintenance Engineering</strong>.
                        Because this is an internationally certified course, students have the opportunity to work on operational
                        'Live' commercial aircraft at Aerojet's Hangar Facility in Ghana or Aerojet's partner facilities overseas.
                    </p>

                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-[#4c9ded]" /> What does it involve?
                        </h3>
                        <p className="text-slate-600 mb-4">
                            As an aircraft maintenance engineer, your work involves installing, maintaining, replacing, and repairing
                            the airframe, engines, and other components on an aircraft. You may specialize in one or more disciplines:
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-3">
                            {['Mechanical Engineering', 'Avionics Engineering', 'Structures Engineering'].map((item, i) => (
                                <li key={i} className="flex gap-2 items-center text-sm font-medium text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-slate-600 mt-4 italic border-l-4 border-[#4c9ded] pl-4">
                            "You may work on flight systems on one day and wing or fuselage materials on another."
                        </p>
                    </div>
                </section>

                {/* Career Opportunities */}
                <section className="bg-aerojet-blue text-white rounded-[3rem] p-12 mb-20 relative overflow-hidden">
                    <div className="relative z-10 max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-center">Careers in Aircraft Engineering</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <Award className="w-8 h-8 text-[#4c9ded]" />
                                </div>
                                <h4 className="font-bold mb-2">Competitive Salaries</h4>
                                <p className="text-sm text-blue-100">£12,000 at entry level to £50,000+ annually with experience. Enjoy flexible shift schedules and quality of life.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <Users className="w-8 h-8 text-[#4c9ded]" />
                                </div>
                                <h4 className="font-bold mb-2">High Demand</h4>
                                <p className="text-sm text-blue-100">Ongoing growth in the aviation industry ensures opportunities with major airlines and MRO's worldwide.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <ShieldCheck className="w-8 h-8 text-[#4c9ded]" />
                                </div>
                                <h4 className="font-bold mb-2">Vital Role</h4>
                                <p className="text-sm text-blue-100">Aircraft Engineers ensure the safety and reliability of air travel - planes cannot fly without their expertise.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Training Programs */}
                <section className="mb-20">
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-10 text-center">Our Training Programs</h2>
                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Program A */}
                        <div className="group border border-slate-200 p-8 rounded-3xl hover:shadow-xl transition-all hover:border-[#4c9ded]">
                            <div className="text-xs font-bold text-[#4c9ded] uppercase tracking-widest mb-2">Program A</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">EASA Part-66 License Certification</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Comprehensive pathways to obtaining your EASA Part-66 license. Includes full-time programs, modular training,
                                exam-only options, and specialized tracks for military and experienced personnel.
                            </p>
                            <Link href="/courses/aircraft-engineering/easa-part-66-programs" className="text-aerojet-blue font-bold text-sm hover:underline">
                                Explore Programs →
                            </Link>
                        </div>

                        {/* Program B */}
                        <div className="group border border-slate-200 p-8 rounded-3xl hover:shadow-xl transition-all hover:border-[#4c9ded]">
                            <div className="text-xs font-bold text-[#4c9ded] uppercase tracking-widest mb-2">Program B</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Other Programs</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Cabin Crew Training, Pilot Training, and other aviation courses. Expand your career opportunities
                                in the aviation industry with our diverse program offerings.
                            </p>
                            <Link href="/courses/aircraft-engineering/other-programs" className="text-aerojet-blue font-bold text-sm hover:underline">
                                View Programs →
                            </Link>
                        </div>

                        {/* Program C */}
                        <div className="group border border-slate-200 p-8 rounded-3xl hover:shadow-xl transition-all hover:border-[#4c9ded]">
                            <div className="text-xs font-bold text-[#4c9ded] uppercase tracking-widest mb-2">Program C</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Certified Short Knowledge Courses</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Focused, intensive courses designed to build specific knowledge and skills.Perfect for professionals
                                seeking to enhance their expertise in targeted areas.
                            </p>
                            <Link href="/courses/aircraft-engineering/short-courses" className="text-aerojet-blue font-bold text-sm hover:underline">
                                Discover Courses →
                            </Link>
                        </div>

                    </div>
                </section>

                {/* Prerequisites Strip */}
                <section className="bg-slate-50 rounded-3xl p-12 mb-20">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Entry Requirements</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-aerojet-blue/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <GraduationCap className="w-6 h-6 text-aerojet-blue" />
                            </div>
                            <h4 className="font-bold mb-2 text-slate-900">Qualifications</h4>
                            <p className="text-sm text-slate-600">SSCE, A-Levels, HND (Math, English, Science) or Bachelor's Degree in any science, mathematics, or engineering field.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-aerojet-blue/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <ShieldCheck className="w-6 h-6 text-aerojet-blue" />
                            </div>
                            <h4 className="font-bold mb-2 text-slate-900">Clearance</h4>
                            <p className="text-sm text-slate-600">Medical assessment and security background checks required for admission.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-aerojet-blue/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <CheckCircle2 className="w-6 h-6 text-aerojet-blue" />
                            </div>
                            <h4 className="font-bold mb-2 text-slate-900">Assessment</h4>
                            <p className="text-sm text-slate-600">Aptitude test and face-to-face interview required after registration.</p>
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-6 rounded-xl mt-8 max-w-2xl mx-auto">
                        <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                            <Award className="w-5 h-5" /> Scholarship Opportunities Available
                        </h4>
                        <p className="text-sm text-green-700">
                            Scholarship opportunities are available for the best candidates after the screening process.
                            Top 50 highest scoring candidates on entry aptitude tests will be considered for 10 available full scholarship slots each year.
                        </p>
                    </div>
                </section>

                {/* License Categories */}
                <section className="mb-20">
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6 text-center">Understanding Category B Licensing</h2>
                    <p className="text-center text-slate-600 mb-10 max-w-3xl mx-auto">
                        At Aerojet Academy, our primary focus is training for Category B Licenses, which cover different aircraft types
                        and allow holders to certify complex maintenance work and issue certificates of release to service.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl">
                            <h4 className="font-bold text-aerojet-blue mb-2">Category B1.1</h4>
                            <p className="text-sm text-slate-600">Aeroplanes Turbine – Mechanical</p>
                        </div>
                        <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl">
                            <h4 className="font-bold text-aerojet-blue mb-2">Category B1.2</h4>
                            <p className="text-sm text-slate-600">Aeroplanes Piston – Mechanical</p>
                        </div>
                        <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl">
                            <h4 className="font-bold text-aerojet-blue mb-2">Category B1.3</h4>
                            <p className="text-sm text-slate-600">Helicopters Turbine – Mechanical</p>
                        </div>
                        <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl">
                            <h4 className="font-bold text-aerojet-blue mb-2">Category B1.4</h4>
                            <p className="text-sm text-slate-600">Helicopters Piston - Mechanical</p>
                        </div>
                        <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl">
                            <h4 className="font-bold text-aerojet-blue mb-2">Category B2</h4>
                            <p className="text-sm text-slate-600">Avionics (All Electronic Systems)</p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <div className="bg-slate-50 p-10 rounded-3xl text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Start Your Journey?</h2>
                    <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                        Gaining access to our portal requires a one-time registration. Once registered, you have lifetime access
                        to browse, buy, and book training programs and courses.
                    </p>
                    <Link href="/register" className="inline-block bg-[#4c9ded] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-aerojet-blue transition-all">
                        Register Now
                    </Link>
                </div>

            </div>
        </main>
    );
}
