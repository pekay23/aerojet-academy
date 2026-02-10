import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import Link from 'next/link';
import { CheckCircle2, Euro, BookOpen, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Modular Training Pricing | Aerojet Academy',
    description: 'EASA Modular Training Program Pricing - Flexible modular learning with comprehensive tuition support.',
};

export default function ModularPricingPage() {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <div className="grow">
                <PageHero
                    title="Modular Training Pricing"
                    subtitle="Flexible Modular Learning - Select individual modules that meet your certification needs"
                    backgroundImage="/modular.jpg"
                />

                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-6xl mx-auto space-y-16">

                        {/* Intro */}
                        <section className="text-center max-w-4xl mx-auto">
                            <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Study at Your Own Pace</h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Select individual modules that meet your certification needs. Each module includes comprehensive tuition support,
                                learning materials, and exam preparation. Study at your own pace with expert guidance.
                            </p>
                        </section>

                        {/* Core Modules Table */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <BookOpen className="w-6 h-6 text-aerojet-blue" />
                                <h3 className="text-2xl font-bold text-aerojet-blue uppercase tracking-tight">Core Modules</h3>
                            </div>
                            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-slate-200">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-aerojet-blue text-white">
                                            <th className="px-6 py-4 text-left font-bold text-sm">Code</th>
                                            <th className="px-6 py-4 text-left font-bold text-sm">Module Name</th>
                                            <th className="px-6 py-4 text-center font-bold text-sm">Hours</th>
                                            <th className="px-6 py-4 text-right font-bold text-sm">Price (EUR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { code: 'M1', name: 'Mathematics', hours: 20, price: '€1,190' },
                                            { code: 'M2', name: 'Physics', hours: 20, price: '€1,190' },
                                            { code: 'M3', name: 'Basic Electricals', hours: 24, price: '€1,400' },
                                            { code: 'M4', name: 'Basic Electronics', hours: 20, price: '€1,190' },
                                            { code: 'M5', name: 'Digital Techniques', hours: 24, price: '€1,400' },
                                            { code: 'M6', name: 'Materials & Hardware', hours: 25, price: '€1,400' },
                                            { code: 'M7', name: 'Maintenance Practices (MCQ)', hours: 15, price: '€1,030' },
                                            { code: 'M8', name: 'Basic Aerodynamics', hours: 15, price: '€1,030' },
                                            { code: 'M9', name: 'Human Factors', hours: 15, price: '€1,030' },
                                            { code: 'M10', name: 'Aviation Legislation (MCQ)', hours: 15, price: '€1,030' },
                                        ].map((module, idx) => (
                                            <tr key={module.code} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                                <td className="px-6 py-4 font-bold text-aerojet-blue text-sm">{module.code}</td>
                                                <td className="px-6 py-4 text-slate-700 text-sm">{module.name}</td>
                                                <td className="px-6 py-4 text-center text-slate-600 text-sm">{module.hours}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">{module.price}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50">
                                            <td className="px-6 py-4 font-bold text-aerojet-blue text-sm">MP Essay</td>
                                            <td className="px-6 py-4 text-slate-700 text-sm">Maintenance Practices (Essay Only)</td>
                                            <td className="px-6 py-4 text-center text-slate-600 text-sm italic">—</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">€340</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 italic">
                                * MP Essay is exam-only and does not include tuition support hours.
                            </p>
                        </section>

                        {/* Specialist Modules Table */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-aerojet-blue" />
                                <h3 className="text-2xl font-bold text-aerojet-blue uppercase tracking-tight">Specialist Modules</h3>
                            </div>
                            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-slate-200">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-green-700 text-white">
                                            <th className="px-6 py-4 text-left font-bold text-sm">Code</th>
                                            <th className="px-6 py-4 text-left font-bold text-sm">Module Name</th>
                                            <th className="px-6 py-4 text-center font-bold text-sm">Hours</th>
                                            <th className="px-6 py-4 text-right font-bold text-sm">Price (EUR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { code: 'M11', name: 'Turbine Aeroplane Aerodynamics & Systems/Structures', hours: 25, price: '€1,400' },
                                            { code: 'M15', name: 'Turbine Engines', hours: 25, price: '€1,400' },
                                            { code: 'M17', name: 'Propellers', hours: 15, price: '€1,090' },
                                            { code: 'M12', name: 'Helicopter Aerodynamics, Structures & Systems', hours: 25, price: '€1,400' },
                                            { code: 'M16', name: 'Piston Engine', hours: 25, price: '€1,400' },
                                        ].map((module, idx) => (
                                            <tr key={module.code} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                                <td className="px-6 py-4 font-bold text-green-700 text-sm">{module.code}</td>
                                                <td className="px-6 py-4 text-slate-700 text-sm">{module.name}</td>
                                                <td className="px-6 py-4 text-center text-slate-600 text-sm">{module.hours}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">{module.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Avionics Modules Table */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Euro className="w-6 h-6 text-aerojet-blue" />
                                <h3 className="text-2xl font-bold text-aerojet-blue uppercase tracking-tight">Avionics Modules</h3>
                            </div>
                            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-slate-200">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-purple-700 text-white">
                                            <th className="px-6 py-4 text-left font-bold text-sm">Code</th>
                                            <th className="px-6 py-4 text-left font-bold text-sm">Module Name</th>
                                            <th className="px-6 py-4 text-center font-bold text-sm">Hours</th>
                                            <th className="px-6 py-4 text-right font-bold text-sm">Price (EUR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { code: 'M13', name: 'Aircraft Aerodynamics, Structures & Systems (Avionics)', hours: 25, price: '€1,400' },
                                            { code: 'M14', name: 'Propulsion', hours: 15, price: '€1,090' },
                                        ].map((module, idx) => (
                                            <tr key={module.code} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                                <td className="px-6 py-4 font-bold text-purple-700 text-sm">{module.code}</td>
                                                <td className="px-6 py-4 text-slate-700 text-sm">{module.name}</td>
                                                <td className="px-6 py-4 text-center text-slate-600 text-sm">{module.hours}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">{module.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* What's Included */}
                        <section className="bg-blue-50 rounded-3xl p-8 md:p-12 border border-blue-100">
                            <h3 className="text-2xl font-bold text-aerojet-blue mb-6">What's Included in Each Module</h3>
                            <p className="text-slate-700 mb-6">
                                Every module includes comprehensive support to ensure your success:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    'Comprehensive classroom tuition support',
                                    'Expert instruction from qualified instructors',
                                    'All learning materials and study resources',
                                    'Exam preparation guidance',
                                    'Flexible scheduling to fit your needs',
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                                        <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Payment Terms */}
                        <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-12">
                            <h3 className="text-2xl font-bold mb-6">Payment Terms</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                    <p className="text-blue-100">
                                        <strong className="text-white">100% upfront payment</strong> required before starting your selected module(s).
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                    <p className="text-blue-100">
                                        All prices have been <strong className="text-white">rounded to the nearest €10</strong> for convenience.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                    <p className="text-blue-100">
                                        Contact us for <strong className="text-white">package deals and savings</strong> on multiple module bookings.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h4 className="font-bold mb-3">Payment Methods</h4>
                                <p className="text-sm text-blue-100 mb-4">
                                    Electronic payments (Visa, Mobile Money), Bank Transfer, or Cheque accepted.
                                    Bank and transfer charges to be borne by student.
                                </p>
                                <p className="text-xs text-blue-200">
                                    Please indicate your course code and registration email as reference.
                                    All payments must be fully cleared before enrollment.
                                </p>
                            </div>
                        </section>

                        {/* CTA */}
                        <div className="bg-gradient-to-r from-aerojet-blue to-[#4c9ded] p-10 rounded-3xl text-center text-white">
                            <h3 className="text-2xl font-bold mb-4">Ready to Book Your Modules?</h3>
                            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                                Register on our portal to get lifetime access and start booking the modules you need.
                            </p>
                            <Link href="/register" className="inline-block bg-white text-aerojet-blue px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-100 transition-all">
                                Register Now
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
