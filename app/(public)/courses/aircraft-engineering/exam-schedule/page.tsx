import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/components/marketing/PageHero';
import Link from 'next/link';
import { CheckCircle2, Users, Euro, Calendar, AlertTriangle, Clock, Award } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Exam Delivery & Pricing | Aerojet Academy',
    description: 'EASA Part-66 Examination booking - Pool seats, individual bookings, bundles, and special pricing programs.',
};

export default function ExamSchedulePage() {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <div className="grow">
                <PageHero
                    title="Exam Delivery & Booking"
                    subtitle="Flexible exam booking options with pool seating, individual slots, and bundle packages"
                    backgroundImage="/examonly.jpg"
                />

                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-6xl mx-auto space-y-16">

                        {/* Important Notice */}
                        <section className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-2xl">
                            <div className="flex gap-4">
                                <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-orange-900 mb-2">Important Notice</h3>
                                    <p className="text-sm text-orange-800">
                                        Exam events only run when minimum confirmed bookings are met. All bookings are subject to the Go/No-Go decision at <strong>T-21 (21 days before exam event)</strong>.
                                        Confirmed paid bookings that do not meet threshold will automatically roll to the next available event window at no additional cost.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* How Exam Events Work */}
                        <section>
                            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">How Exam Events Work</h2>
                            <p className="text-lg text-slate-700 mb-6">
                                Our partner examiner travels to deliver EASA Part-66 module examinations when we reach minimum viable booking thresholds.
                                Each exam event is scheduled approximately every 3 months and runs over 2-3 days to accommodate multiple exam pools (sittings).
                            </p>

                            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100">
                                <h4 className="font-bold text-aerojet-blue mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5" /> What is an Exam Pool?
                                </h4>
                                <p className="text-slate-700 mb-4">
                                    An exam pool is a single exam sitting that brings together candidates who may not know each other. Each pool:
                                </p>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0" /> Accommodates 25-28 candidates</li>
                                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0" /> Each candidate takes ONE module per pool</li>
                                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0" /> Supports up to 4 different module codes within the same sitting</li>
                                    <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0" /> Confirms automatically when 25 candidates have reserved and paid</li>
                                </ul>
                                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                                    <p className="text-xs text-slate-600">
                                        <strong>Example:</strong> Pool A might have 7 candidates taking M1, 8 taking M7, 6 taking M8, and 5 taking M15 - all in the same exam session.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Exam Pricing Table */}
                        <section>
                            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Exam Pricing (EUR)</h2>
                            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-slate-200">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-aerojet-blue text-white">
                                            <th className="px-6 py-4 text-left font-bold text-sm">Booking Type</th>
                                            <th className="px-6 py-4 text-center font-bold text-sm">Price</th>
                                            <th className="px-6 py-4 text-left font-bold text-sm">Notes / Inclusions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr className="bg-green-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">Pool Seat <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full ml-2">MOST POPULAR</span></td>
                                            <td className="px-6 py-4 text-center font-bold text-lg text-green-700">€300</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                One module exam seat. Join via Portal. Pool confirms when 25+ candidates book. Includes pre-exam clinic where scheduled. <strong className="text-green-700">Save €220 vs individual booking!</strong>
                                            </td>
                                        </tr>
                                        <tr className="bg-white">
                                            <td className="px-6 py-4 font-bold text-slate-900">Individual Exam Seat</td>
                                            <td className="px-6 py-4 text-center font-bold text-lg text-slate-900">€520</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                Guaranteed slot (first-come, first-served). One module exam seat + pre-exam group clinic where scheduled. Premium pricing for flexibility.
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">2-Seat Bundle</td>
                                            <td className="px-6 py-4 text-center font-bold text-lg text-slate-900">€980<br /><span className="text-xs text-slate-500">(€490/seat)</span></td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                Two exam seats (any modules). Valid 12 months. Includes 1 free module change if requested by T-21.
                                            </td>
                                        </tr>
                                        <tr className="bg-white">
                                            <td className="px-6 py-4 font-bold text-slate-900">4-Seat Bundle</td>
                                            <td className="px-6 py-4 text-center font-bold text-lg text-slate-900">€1,900<br /><span className="text-xs text-slate-500">(€475/seat)</span></td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                Four exam seats (any modules). Valid 12 months. Includes 2 free module changes if requested by T-21.
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">Resit</td>
                                            <td className="px-6 py-4 text-center font-bold text-lg text-slate-900">€480</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                Subject to availability in upcoming exam windows (outside of bundle).
                                            </td>
                                        </tr>
                                        <tr className="bg-blue-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">Organization/Military Group Charter</td>
                                            <td className="px-6 py-4 text-center font-bold text-lg text-blue-700">€7,500</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                Per sitting, up to 28 seats. Up to 28 candidates from your organization. Mix up to 4 modules within the sitting.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Special Pricing Programs */}
                        <section>
                            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-8">Special Pricing Programs</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl">
                                    <Award className="w-10 h-10 mb-4 text-purple-200" />
                                    <h3 className="text-xl font-bold mb-3">Multi-Pool Discount</h3>
                                    <div className="text-3xl font-black mb-4">€270/seat</div>
                                    <p className="text-sm text-purple-100 mb-4">
                                        Book and confirm 3 or more pool seats in the same exam event (e.g., Pool A Monday AM, Pool B Monday PM, Pool C Tuesday AM).
                                    </p>
                                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                        <p className="text-xs text-purple-100">
                                            ✓ Automatically applied at checkout<br />
                                            ✓ Save €90 vs standard pool pricing<br />
                                            ✓ Accelerated learning pathway
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-8 rounded-3xl text-white shadow-xl">
                                    <Users className="w-10 h-10 mb-4 text-orange-200" />
                                    <h3 className="text-xl font-bold mb-3">Ambassador Program</h3>
                                    <div className="text-3xl font-black mb-4">€270/seat + €100 credit</div>
                                    <p className="text-sm text-orange-100 mb-4">
                                        Successfully refer 10+ candidates who complete pool bookings. Ambassadors receive lifetime pricing benefits.
                                    </p>
                                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                        <p className="text-xs text-orange-100">
                                            ✓ €270/seat pricing for life on all future pool bookings<br />
                                            ✓ €100 wallet credit upon reaching 10 confirmed referrals<br />
                                            ✓ Share your unique referral link via Portal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Booking Conditions */}
                        <section className="bg-slate-50 rounded-3xl p-8 md:p-12">
                            <h2 className="text-2xl font-bold text-aerojet-blue mb-8">Booking Conditions</h2>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-aerojet-blue" /> Event Confirmation (Go/No-Go Decision)
                                    </h4>
                                    <p className="text-sm text-slate-700 mb-3">
                                        An exam event confirms and proceeds when ANY of the following thresholds are met 21 days before the event start date:
                                    </p>
                                    <ul className="space-y-2 text-sm text-slate-700 pl-4">
                                        <li className="flex gap-2">• 3 exam pools have reached 25+ confirmed candidates each (€30,000 revenue), OR</li>
                                        <li className="flex gap-2">• 2 confirmed pools (25+ each) + 15 individual/bundle seats (€27,800+ revenue), OR</li>
                                        <li className="flex gap-2">• 60 total confirmed paid seats across all booking types (€25,200+ revenue)</li>
                                    </ul>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <h5 className="font-bold text-slate-900 mb-3">Pool-Specific Rules</h5>
                                        <ul className="space-y-2 text-xs text-slate-600">
                                            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Pool confirms when 25 candidates have reserved and paid</li>
                                            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Capacity: Min 25, Max 28 candidates per pool</li>
                                            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Each pool supports up to 4 different module codes</li>
                                            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Pool status visible in real-time via Portal</li>
                                        </ul>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <h5 className="font-bold text-slate-900 mb-3">Payment Terms</h5>
                                        <ul className="space-y-2 text-xs text-slate-600">
                                            <li className="flex gap-2"><Euro className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Pool Seats: Full payment (€300) required to reserve</li>
                                            <li className="flex gap-2"><Euro className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Individual: 50% deposit to reserve, balance due by T-21</li>
                                            <li className="flex gap-2"><Euro className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Bundles: Paid in full to activate (or installment plan)</li>
                                            <li className="flex gap-2"><Clock className="w-4 h-4 text-[#4c9ded] shrink-0 mt-0.5" /> Late booking surcharge: €50 (within 14 days of event)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                                    <h5 className="font-bold text-red-900 mb-2">Changes, Postponements & Credits</h5>
                                    <p className="text-sm text-red-800 mb-3">
                                        <strong>No cash refunds policy.</strong> All changes result in wallet credits to student cash account.
                                    </p>
                                    <ul className="space-y-2 text-xs text-red-800">
                                        <li>• Aerojet-initiated postponements: All bookings automatically roll forward as wallet credit</li>
                                        <li>• Module changes: €50 admin fee (waived for bundle holders' included free changes)</li>
                                        <li>• Cancellations 21+ days before event: Eligible for wallet credit at Aerojet's discretion</li>
                                        <li>• No-shows: Forfeit seat (refund only with verified medical reason)</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Contact & CTA */}
                        <section className="bg-gradient-to-r from-aerojet-blue to-[#4c9ded] p-10 rounded-3xl text-white text-center">
                            <h2 className="text-2xl font-bold mb-4">Ready to Book Your Exam?</h2>
                            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                                Register on our portal to view available exam pools and book your seats.
                            </p>
                            <Link href="/register" className="inline-block bg-white text-aerojet-blue px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-100 transition-all mb-8">
                                Register Now
                            </Link>
                            <div className="pt-8 border-t border-white/20">
                                <h4 className="font-bold mb-3">Contact & Bookings</h4>
                                <div className="text-sm text-blue-100 space-y-1">
                                    <p>Email: trainingprograms@aerojet-academy.com | training@aerojet-aviation.com</p>
                                    <p>Phone/WhatsApp: +233 209 848 423</p>
                                    <p>Portal: www.aerojet-academy.com/exam-portal</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}
