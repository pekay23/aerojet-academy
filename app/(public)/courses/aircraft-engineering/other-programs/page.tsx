import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/components/marketing/PageHero';
import Link from 'next/link';
import { Plane, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Other Aviation Programs | Aerojet Academy',
    description: 'Cabin Crew Training, Pilot Training, and additional aviation courses at Aerojet Academy.',
};

export default function OtherProgramsPage() {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <div className="grow">
                <PageHero
                    title="Other Aviation Programs"
                    subtitle="Expand your aviation career opportunities with our diverse program offerings"
                    backgroundImage="/coursespage.jpg"
                />

                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-6xl mx-auto space-y-16">

                        {/* Intro */}
                        <section className="text-center max-w-4xl mx-auto">
                            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Beyond Aircraft Engineering</h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Aerojet Aviation Training Academy offers a variety of aviation training programs beyond aircraft engineering.
                                Whether you're interested in becoming cabin crew or a pilot, we're expanding our offerings to meet the growing
                                demand in the aviation industry.
                            </p>
                        </section>

                        {/* Program Cards */}
                        <section className="grid md:grid-cols-2 gap-8">

                            {/* Cabin Crew Training */}
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 p-8 rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Users className="w-32 h-32 text-purple-600" />
                                </div>
                                <div className="relative z-10">
                                    <div className="inline-block bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                                        Coming Soon
                                    </div>
                                    <h3 className="text-2xl font-bold text-purple-900 mb-4">Cabin Crew Training</h3>
                                    <p className="text-slate-700 mb-6">
                                        Comprehensive cabin crew training program designed to prepare you for a career in passenger service
                                        and aviation safety. Learn essential skills in customer service, safety procedures, emergency response,
                                        and aviation operations.
                                    </p>

                                    <div className="bg-white/70 backdrop-blur p-6 rounded-2xl mb-6">
                                        <h4 className="font-bold text-purple-900 mb-3 text-sm">What You'll Learn:</h4>
                                        <ul className="space-y-2 text-sm text-slate-700">
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                                                <span>Aviation safety and emergency procedures</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                                                <span>Customer service excellence</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                                                <span>First aid and medical emergency response</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                                                <span>Cultural awareness and communication</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-purple-100 border border-purple-200 p-4 rounded-xl">
                                        <p className="text-xs text-purple-800">
                                            <strong>Program Launch:</strong> Details and enrollment information will be announced soon.
                                            Register on our portal to receive updates.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pilot Training */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 p-8 rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Plane className="w-32 h-32 text-blue-600" />
                                </div>
                                <div className="relative z-10">
                                    <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                                        Coming Soon
                                    </div>
                                    <h3 className="text-2xl font-bold text-blue-900 mb-4">Pilot Training</h3>
                                    <p className="text-slate-700 mb-6">
                                        Professional pilot training program leading to commercial pilot certification. Comprehensive ground school
                                        and flight training designed to meet international aviation standards and prepare you for a career as a
                                        professional pilot.
                                    </p>

                                    <div className="bg-white/70 backdrop-blur p-6 rounded-2xl mb-6">
                                        <h4 className="font-bold text-blue-900 mb-3 text-sm">Program Highlights:</h4>
                                        <ul className="space-y-2 text-sm text-slate-700">
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                                                <span>Ground school training (aviation theory)</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                                                <span>Flight simulator training</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                                                <span>Practical flight training hours</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                                                <span>Preparation for commercial pilot license</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-blue-100 border border-blue-200 p-4 rounded-xl">
                                        <p className="text-xs text-blue-800">
                                            <strong>Program Launch:</strong> Pilot training program details will be announced soon.
                                            Stay tuned for enrollment information and requirements.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </section>

                        {/* Admin Managed Content Info */}
                        <section className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200">
                            <div className="flex gap-4 items-start">
                                <AlertCircle className="w-8 h-8 text-aerojet-blue shrink-0" />
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Expanding Program Offerings</h3>
                                    <p className="text-slate-700 mb-4">
                                        Aerojet Academy is continuously expanding its training programs to meet the needs of the aviation industry.
                                        Additional courses and specializations can be added by the administrative team through the portal.
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        All new programs added will appear on this page automatically and maintain the same professional design
                                        and user experience you see throughout our site.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Get Notified */}
                        <section className="bg-gradient-to-r from-aerojet-blue to-[#4c9ded] p-10 rounded-3xl text-white text-center">
                            <h2 className="text-2xl font-bold mb-4">Get Notified When Programs Launch</h2>
                            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                                Register on our portal to receive updates about new program launches, enrollment dates, and special opportunities.
                            </p>
                            <Link href="/register" className="inline-block bg-white text-aerojet-blue px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-100 transition-all">
                                Register for Updates
                            </Link>
                        </section>

                        {/* Contact Section */}
                        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Questions About Our Programs?</h3>
                            <p className="text-slate-600 mb-6">
                                For inquiries about upcoming programs, partnerships, or custom training solutions for organizations,
                                please contact our admissions team.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h5 className="font-bold text-slate-900 mb-2">Email</h5>
                                    <p className="text-slate-600">
                                        trainingprograms@aerojet-academy.com<br />
                                        training@aerojet-aviation.com
                                    </p>
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900 mb-2">Phone/WhatsApp</h5>
                                    <p className="text-slate-600">+233 209 848 423</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}
