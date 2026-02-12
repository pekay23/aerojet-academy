import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/components/marketing/PageHero';
import Link from 'next/link';
import { BookOpen, Clock, Award, CheckCircle2, Users } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Certified Short Knowledge Courses | Aerojet Academy',
    description: 'Focused, intensive aviation knowledge courses designed to build specific skills and expertise.',
};

export default function ShortCoursesPage() {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <div className="grow">
                <PageHero
                    title="Certified Short Knowledge Courses"
                    subtitle="Focused, intensive courses designed to build specific knowledge and skills"
                    backgroundImage="/modular.jpg"
                />

                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-6xl mx-auto space-y-16">

                        {/* Intro */}
                        <section className="text-center max-w-4xl mx-auto">
                            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Build Targeted Expertise</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                Our Certified Short Knowledge Courses are designed for professionals seeking to enhance their expertise
                                in targeted areas of aviation maintenance and engineering. These intensive courses provide focused training
                                that can be completed in days or weeks, not months or years.
                            </p>
                        </section>

                        {/* Course Features */}
                        <section>
                            <h3 className="text-2xl font-bold text-aerojet-blue mb-8 text-center">Course Features</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-white border-2 border-slate-200 p-8 rounded-3xl text-center hover:border-[#4c9ded] transition-all">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-aerojet-blue" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-3">Flexible Duration</h4>
                                    <p className="text-sm text-slate-600">
                                        Courses range from 2-day intensive workshops to 2-week comprehensive programs, designed to fit your schedule.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-slate-200 p-8 rounded-3xl text-center hover:border-[#4c9ded] transition-all">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-aerojet-blue" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-3">Expert Instructors</h4>
                                    <p className="text-sm text-slate-600">
                                        Learn from experienced aviation professionals with real-world expertise in their respective fields.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-slate-200 p-8 rounded-3xl text-center hover:border-[#4c9ded] transition-all">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Award className="w-8 h-8 text-aerojet-blue" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-3">Certification</h4>
                                    <p className="text-sm text-slate-600">
                                        Receive certificates upon successful completion, recognized across the aviation industry.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Who Should Attend */}
                        <section className="bg-slate-50 rounded-3xl p-8 md:p-12">
                            <h3 className="text-2xl font-bold text-aerojet-blue mb-6">Who Should Attend</h3>
                            <p className="text-slate-700 mb-6">
                                These courses are ideal for:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    { title: 'Licensed Engineers', desc: 'Looking to specialize or update knowledge in specific areas' },
                                    { title: 'Maintenance Technicians', desc: 'Seeking to build expertise beyond their current qualifications' },
                                    { title: 'Aviation Professionals', desc: 'Wanting to understand aircraft systems and maintenance practices' },
                                    { title: 'Career Changers', desc: 'Exploring aviation maintenance as a potential career path' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-3 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                        <CheckCircle2 className="w-6 h-6 text-[#4c9ded] shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-slate-900 mb-1">{item.title}</h5>
                                            <p className="text-xs text-slate-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Sample Course Topics */}
                        <section>
                            <h3 className="text-2xl font-bold text-aerojet-blue mb-8 text-center">Example Course Topics</h3>
                            <p className="text-center text-slate-600 mb-8 max-w-3xl mx-auto">
                                Our short courses cover a wide range of specialized topics. Course offerings are regularly updated by our
                                administrative team based on industry demand and technological developments.
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    'Aircraft Composite Repair Techniques',
                                    'Avionics Troubleshooting Fundamentals',
                                    'Human Factors in Aviation Maintenance',
                                    'Non-Destructive Testing (NDT) Methods',
                                    'Aircraft Electrical Systems Workshop',
                                    'Safety Management Systems (SMS)',
                                ].map((topic, idx) => (
                                    <div key={idx} className="bg-gradient-to-br from-aerojet-blue to-[#4c9ded] p-6 rounded-2xl text-white">
                                        <BookOpen className="w-6 h-6 mb-3 text-blue-100" />
                                        <h4 className="font-bold text-sm">{topic}</h4>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-6 italic">
                                * Topics shown are examples. Actual course availability varies. Check portal for current offerings.
                            </p>
                        </section>

                        {/* Admin Managed */}
                        <section className="bg-blue-50 border border-blue-200 rounded-3xl p-8 md:p-12">
                            <div className="flex gap-4 items-start">
                                <BookOpen className="w-8 h-8 text-aerojet-blue shrink-0" />
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Dynamic Course Catalog</h3>
                                    <p className="text-slate-700 mb-4">
                                        Our short course offerings are continuously updated to meet industry needs and technological advances.
                                        New courses are added regularly by our administrative team through the portal, ensuring you have access
                                        to the most relevant and current training.
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        All courses added by administrators will automatically appear on this page with full details including
                                        duration, pricing, prerequisites, and booking information.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* How to Enroll */}
                        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">How to Enroll</h3>
                            <div className="space-y-4">
                                {[
                                    { step: 1, title: 'Register on Portal', desc: 'Create your account for lifetime access to all courses' },
                                    { step: 2, title: 'Browse Available Courses', desc: 'View current short course offerings with dates and pricing' },
                                    { step: 3, title: 'Book Your Course', desc: 'Select and pay for your chosen course directly through the portal' },
                                    { step: 4, title: 'Receive Confirmation', desc: 'Get course details, location, and preparation materials' },
                                ].map((item) => (
                                    <div key={item.step} className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full bg-aerojet-blue text-white flex items-center justify-center font-bold shrink-0">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-aerojet-blue mb-1">{item.title}</h5>
                                            <p className="text-sm text-slate-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* CTA */}
                        <section className="bg-gradient-to-r from-aerojet-blue to-[#4c9ded] p-10 rounded-3xl text-white text-center">
                            <h2 className="text-2xl font-bold mb-4">Ready to Enhance Your Skills?</h2>
                            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                                Register on our portal to view available short courses and book your seat today.
                            </p>
                            <Link href="/register" className="inline-block bg-white text-aerojet-blue px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-100 transition-all mb-8">
                                View Available Courses
                            </Link>
                            <div className="pt-8 border-t border-white/20">
                                <h4 className="font-bold mb-3">Questions?</h4>
                                <div className="text-sm text-blue-100 space-y-1">
                                    <p>Email: trainingprograms@aerojet-academy.com</p>
                                    <p>Phone/WhatsApp: +233 209 848 423</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}
