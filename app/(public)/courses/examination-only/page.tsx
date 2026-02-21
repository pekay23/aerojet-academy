import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/components/marketing/PageHero';
import Link from 'next/link';
import { BookOpen, Calendar, CheckCircle2, AlertTriangle, Users, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Examination Only | Aerojet Academy',
    description: 'Sit for EASA Part-66 Exams with Aerojet Academy. Flexible exam pools for self-study candidates.',
};

export default function ExamOnlyPage() {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <div className="grow">
                <PageHero
                    title="Examination Only"
                    subtitle="Self-study option for candidates who are confident studying on their own."
                    backgroundImage="/examonly.jpg"
                />

                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-12">

                        {/* LEFT CONTENT (2/3 width) */}
                        <div className="lg:col-span-2 space-y-12">
                            {/* Intro */}
                            <section>
                                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Self-Study & Exams</h2>
                                <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
                                    The Exam Only option is ideal for our customers who are very confident studying on their own and require no tuition support.
                                    Candidates for this will usually get learning materials for the booked module and be able to book exam slots at their convenience.
                                </p>
                                <p className="text-slate-700 mb-6">
                                    Aerojet’s facility is a <strong>Certified EASA Part 147 Facility</strong> and as such all EASA Examination rules apply.
                                </p>
                            </section>

                            {/* How it Works */}
                            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                                <h3 className="text-xl font-bold text-aerojet-blue mb-6 flex items-center gap-3">
                                    <Calendar className="w-6 h-6 text-aerojet-sky" /> How Exam Events Work
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-aerojet-blue text-white rounded-full flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Quarterly Windows</h4>
                                            <p className="text-slate-600 text-sm mt-1">Exams are delivered in 4 windows per year (approx. every 3 months).</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-aerojet-blue text-white rounded-full flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Minimum Numbers (Go/No-Go)</h4>
                                            <p className="text-slate-600 text-sm mt-1">
                                                Each exam window requires a minimum of <strong>60 confirmed seats</strong> to proceed.
                                                The decision to proceed is made on the "Payment Deadline" (T-21 days before exam).
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-aerojet-blue text-white rounded-full flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Confirmation</h4>
                                            <p className="text-slate-600 text-sm mt-1">
                                                If the minimum is met, the window is confirmed. If not, the window is cancelled and all bookings
                                                automatically roll over to the next window.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Exam Pools */}
                            <section className="bg-white border-2 border-slate-100 p-8 rounded-3xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-aerojet-sky/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <h3 className="text-xl font-bold text-aerojet-blue mb-6 flex items-center gap-3">
                                    <Users className="w-6 h-6 text-aerojet-sky" /> Understanding Exam Pools
                                </h3>
                                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                                    To make exams more affordable, we offer "Exam Pools". This allows a group of students (e.g., from the same university or workplace)
                                    to book together to reach the minimum number required for a confirmed sitting.
                                </p>
                                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                    <h4 className="font-bold text-aerojet-blue text-sm mb-2">Pool Benefits</h4>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2 text-sm text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Reduced cost per seat
                                        </li>
                                        <li className="flex gap-2 text-sm text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Higher likelihood of window confirmation
                                        </li>
                                        <li className="flex gap-2 text-sm text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Coordinated study schedules
                                        </li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT SIDEBAR (1/3 width) */}
                        <aside className="space-y-8">

                            {/* Booking Conditions */}
                            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <AlertTriangle className="w-24 h-24" />
                                </div>
                                <h3 className="font-bold text-lg mb-4 text-aerojet-sky relative z-10">Booking Conditions</h3>
                                <ul className="space-y-4 relative z-10">
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <span className="text-aerojet-sky font-bold mt-1">•</span>
                                        <span>All exam seats must be <strong>paid in full</strong> by the Payment Deadline (21 days prior).</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <span className="text-aerojet-sky font-bold mt-1">•</span>
                                        <span>Unpaid seats will be cancelled.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <span className="text-aerojet-sky font-bold mt-1">•</span>
                                        <span>If window cancelled, fees roll over to next window.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <span className="text-aerojet-sky font-bold mt-1">•</span>
                                        <span>No refunds for withdrawals within 21 days.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* CTA Card */}
                            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                                <h3 className="font-bold text-lg mb-4 text-aerojet-blue">Ready to Book?</h3>
                                <p className="text-sm text-slate-600 mb-6">
                                    Register now to access the portal, view upcoming exam schedules, and book your seat.
                                </p>
                                <Link href="/register" className="flex items-center justify-center gap-2 w-full bg-aerojet-blue text-white font-bold py-3 rounded-xl hover:bg-aerojet-sky transition-colors uppercase tracking-wider text-sm">
                                    Register Now <ArrowRight className="w-4 h-4" />
                                </Link>
                                <div className="mt-4 text-center">
                                    <Link href="/courses/exam-schedule" className="text-xs text-slate-500 underline hover:text-aerojet-blue">
                                        View Exam Schedule
                                    </Link>
                                </div>
                            </div>

                            {/* Support */}
                            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-2">Need Tuition?</h4>
                                <p className="text-xs text-slate-500 mb-4">Check out our Modular Training options if you need classroom support.</p>
                                <Link href="/courses/easa-modular" className="text-sm font-bold text-aerojet-blue hover:text-aerojet-sky">
                                    View Modular Programs →
                                </Link>
                            </div>

                        </aside>

                    </div>
                </div>
            </div>
        </main>
    );
}
