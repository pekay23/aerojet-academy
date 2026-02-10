import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import Link from 'next/link';
import { CheckCircle2, Clock, Users, BookOpen, Award, AlertCircle, Calendar, MonitorPlay } from 'lucide-react';

export const metadata: Metadata = {
    title: 'EASA Part-66 License Certification Programs | Aerojet Academy',
    description: 'Comprehensive EASA Part-66 training pathways: Full-time, Modular, Exam-only, and specialized tracks.',
};

export default function EASAPart66ProgramsPage() {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <div className="grow">
                <PageHero
                    title="EASA Part-66 License Certification"
                    subtitle="Multiple pathways to your Aircraft Maintenance Engineer License. Choose the route that fits your needs."
                    backgroundImage="/modular.jpg"
                />

                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-6xl mx-auto space-y-24">

                        {/* Overview */}
                        <section className="text-center max-w-4xl mx-auto">
                            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Your Path to EASA Certification</h2>
                            <p className="text-lg text-slate-700 leading-relaxed mb-6">
                                Choose from multiple training pathways designed to meet your specific needs and circumstances.
                                Whether you're just starting out, transitioning from military service, or working full-time while studying,
                                we have a program for you.
                            </p>
                        </section>

                        {/* Full-Time 4-Year Program */}
                        <section className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-lg">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="bg-aerojet-blue text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Full-Time Training</span>
                                <span className="bg-blue-100 text-aerojet-blue px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">B1.1 & B2 License</span>
                            </div>

                            <h3 className="text-3xl md:text-4xl font-black text-aerojet-blue mb-6">4-Year Full-Time Training Program</h3>

                            <div className="prose prose-slate max-w-none text-slate-700 mb-8">
                                <p className="text-lg">
                                    If you are looking for a career in the Civil Aviation Industry and are interested in aircraft maintenance,
                                    this is the course for you. You will be working towards one of the industry's most widely recognized qualification standards.
                                </p>
                                <p>
                                    This four-year program includes a required experience period of <strong>two years working on live operational aircraft</strong> under strict supervision.
                                    The training program will teach you everything you need to know about aircraft maintenance.
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex gap-4 items-start mb-10">
                                <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-green-800 text-lg">Guaranteed Full-Time Job</h4>
                                    <p className="text-green-700 mt-1">
                                        Successful completion of this program will <strong>guarantee you a job</strong> with Aerojet Aviation's Engineering/MRO division.
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-aerojet-blue mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5" /> Course Details
                                    </h4>
                                    <ul className="space-y-3 text-sm text-slate-600">
                                        <li className="flex gap-3 items-start">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span><strong>Duration:</strong> 4 years including 2 years hands-on experience</span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span><strong>Schedule:</strong> 08:00 – 15:00 daily, Monday to Friday</span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span><strong>Pass Mark:</strong> 75% and above in each module</span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span><strong>Attendance:</strong> More than 90% required</span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span><strong>Hands-on Training:</strong> Over 2000 hours required</span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-aerojet-blue mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" /> What You'll Learn
                                    </h4>
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

                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                                <h4 className="font-bold text-aerojet-blue mb-3">What's Provided</h4>
                                <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#4c9ded]" />
                                        <span>All learning materials & study resources</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#4c9ded]" />
                                        <span>PPE: Boots and uniform/clothing</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#4c9ded]" />
                                        <span>Expert instruction from qualified instructors</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#4c9ded]" />
                                        <span>EASA Part 66 License application assistance</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 mt-4">
                                    <strong>Note:</strong> Students required to bring their own pens, notebooks, drawing equipment, and scientific calculator.
                                </p>
                            </div>
                        </section>

                        {/* Military / Experienced Track */}
                        <section className="bg-aerojet-blue rounded-[3rem] p-8 md:p-12 text-white shadow-2xl">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <span className="bg-[#4c9ded] text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Fast-Track</span>
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Military / Experienced Personnel (1 Year)</h2>
                                    <p className="text-blue-100 leading-relaxed mb-6 font-medium">
                                        Designed specifically for Military personnel or technicians with <strong>5+ years of verifiable experience</strong> who lack EASA certification.
                                        This fast-track course is a strictly theoretical intensive program aimed at preparing students to pass all their EASA exams.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 text-sm text-blue-50">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0" />
                                            <span><strong>Subsidized:</strong> Special pricing for military personnel only.</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-blue-50">
                                            <Clock className="w-5 h-5 text-[#4c9ded] shrink-0" />
                                            <span><strong>Schedule:</strong> Evening classes (16:00 – 19:00 Mon-Fri).</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-blue-50">
                                            <AlertCircle className="w-5 h-5 text-[#4c9ded] shrink-0" />
                                            <span><strong>Note:</strong> Strictly theoretical (no hand-skills training).</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/10 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <h3 className="font-bold text-[#4c9ded] uppercase text-sm tracking-widest mb-4">Program Benefits</h3>
                                    <ul className="space-y-4 text-sm text-white">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span>Guidance on EASA Part 66 License application process</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span>Eligible to apply for work experience slots at Aerojet's EASA Part 145 Facility upon completion</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span>All technical training notes & study materials included</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                            <span>Tuition and examination fees included</span>
                                        </li>
                                    </ul>
                                    <Link href="/register" className="block w-full text-center bg-[#4c9ded] text-white mt-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all">
                                        Apply for Fast-Track
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* Modular Training Program */}
                        <section>
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="bg-green-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Flexible Learning</span>
                            </div>
                            <h2 className="text-3xl font-black text-aerojet-blue mb-6">Modular Training Program</h2>

                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <p className="text-lg text-slate-700 leading-relaxed">
                                        This course option allows for a bit more flexibility than the rigorous full-time four-year training program.
                                        With the modular training program, you can <strong>study at your own pace</strong> by booking any of the EASA B1 or B2 Modules.
                                    </p>

                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                        <h4 className="font-bold text-aerojet-blue mb-3 text-lg flex items-center gap-2">
                                            <Users className="w-5 h-5" /> Who is this for?
                                        </h4>
                                        <ul className="space-y-3 text-slate-600">
                                            <li className="flex gap-2 items-start">
                                                <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                                <div>Candidates working full-time in a different industry who want to pursue aircraft maintenance while still working.</div>
                                            </li>
                                            <li className="flex gap-2 items-start">
                                                <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                                <div>Non-licensed or trainee mechanics working with an airline looking to obtain their EASA license.</div>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                            <Calendar className="w-6 h-6 text-aerojet-blue mb-3" />
                                            <h5 className="font-bold text-slate-900 mb-2">Flexible Tuition Slots</h5>
                                            <p className="text-sm text-slate-600">
                                                Book evening or weekend classroom tuition slots at your convenience. Schedule: 10:30 –12:30 (mornings) and 16:00 – 19:00 (afternoons).
                                            </p>
                                        </div>
                                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                            <MonitorPlay className="w-6 h-6 text-aerojet-blue mb-3" />
                                            <h5 className="font-bold text-slate-900 mb-2">Exam Prep Sessions</h5>
                                            <p className="text-sm text-slate-600">
                                                Benefit from 2-3 hour pre-exam brush-up sessions right before each exam for every module you book.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex gap-4">
                                        <AlertCircle className="w-8 h-8 text-orange-600 shrink-0" />
                                        <div>
                                            <strong className="block text-orange-900 mb-1">Important Note</strong>
                                            <p className="text-sm text-orange-800 leading-relaxed">
                                                This modular program does <strong>NOT</strong> come with work experience or practical training. Candidates must meet the EASA experience requirements independently.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl sticky top-24">
                                        <Award className="w-12 h-12 text-[#4c9ded] mb-4" />
                                        <h4 className="text-xl font-bold mb-2">Modular Pricing</h4>
                                        <p className="text-sm text-slate-300 mb-6">
                                            View detailed pricing for core modules (M1-M10), specialist modules, and avionics modules.
                                        </p>
                                        <Link href="/courses/aircraft-engineering/modular-pricing" className="block w-full text-center bg-[#4c9ded] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all">
                                            View Pricing
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Exam Only */}
                        <section className="bg-slate-50 rounded-3xl p-8 md:p-12">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Self-Study</span>
                            </div>
                            <h2 className="text-3xl font-black text-aerojet-blue mb-6">Examination Only</h2>

                            <div className="grid lg:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                                        The Exam Only option is ideal for customers who are very confident studying on their own and require no tuition support.
                                        Candidates will receive learning materials for the booked module and be able to book exam slots at their convenience.
                                    </p>

                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                        <h4 className="font-bold text-aerojet-blue mb-4 text-lg">What's Included</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                                <BookOpen className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                                <div>
                                                    <h5 className="font-bold text-slate-900 text-sm">Exam Fee & Learning Materials</h5>
                                                    <p className="text-xs text-slate-600">Full access to study guides and the examination sitting.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                                                <MonitorPlay className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                                                <div>
                                                    <h5 className="font-bold text-slate-900 text-sm">1 Online Prep Session</h5>
                                                    <p className="text-xs text-slate-600">Complimentary online prep session included in the package.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="p-8 rounded-3xl bg-aerojet-blue text-white shadow-xl">
                                        <h4 className="text-xl font-bold mb-2">Exam Schedule & Pricing</h4>
                                        <p className="text-sm text-blue-100 mb-6">
                                            View our comprehensive exam delivery model with pool seating, individual bookings, bundles, and special pricing programs.
                                        </p>
                                        <Link href="/courses/aircraft-engineering/exam-schedule" className="block w-full text-center bg-[#4c9ded] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all mb-4">
                                            View Exam Schedule
                                        </Link>
                                        <p className="text-xs text-blue-200 text-center">
                                            Pool seats from €300 | Individual seats from €520
                                        </p>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
                                        <h5 className="font-bold text-slate-900 mb-3 text-sm">EASA Part 147 Certified</h5>
                                        <p className="text-xs text-slate-600">
                                            Aerojet's facility is a Certified EASA Part 147 Facility. All EASA Examination rules apply.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* How to Apply */}
                        <section className="border-l-4 border-aerojet-blue bg-white p-8 shadow-sm">
                            <h3 className="text-2xl font-bold text-slate-900 mb-8">How to Apply in 5 Easy Steps</h3>
                            <div className="space-y-6 max-w-3xl">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-aerojet-blue text-white flex items-center justify-center font-bold shrink-0">1</div>
                                    <div>
                                        <h5 className="font-bold text-aerojet-blue mb-1">Register on our Portal</h5>
                                        <p className="text-sm text-slate-600">Pay and register with the Training Academy for lifetime access.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-aerojet-blue text-white flex items-center justify-center font-bold shrink-0">2</div>
                                    <div>
                                        <h5 className="font-bold text-aerojet-blue mb-1">Complete Aptitude Tests</h5>
                                        <p className="text-sm text-slate-600">After registration, receive a link to complete online assessment tests.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-aerojet-blue text-white flex items-center justify-center font-bold shrink-0">3</div>
                                    <div>
                                        <h5 className="font-bold text-aerojet-blue mb-1">Face-to-Face Interview</h5>
                                        <p className="text-sm text-slate-600">Shortlisted candidates are invited for interview and skill capability assessment.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-aerojet-blue text-white flex items-center justify-center font-bold shrink-0">4</div>
                                    <div>
                                        <h5 className="font-bold text-aerojet-blue mb-1">Clearance Checks</h5>
                                        <p className="text-sm text-slate-600">Complete police background check and medical assessment at your own cost.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-aerojet-blue text-white flex items-center justify-center font-bold shrink-0">5</div>
                                    <div>
                                        <h5 className="font-bold text-aerojet-blue mb-1">Start Your Course</h5>
                                        <p className="text-sm text-slate-600">Book and make payment for your chosen course and begin your journey!</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-green-50 border border-green-100 p-6 rounded-xl max-w-3xl">
                                <h5 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                    <Award className="w-5 h-5" /> Top 50 Candidates Eligible for Scholarships
                                </h5>
                                <p className="text-sm text-green-700">
                                    The top 50 highest scoring candidates on entry aptitude tests will be selected for further assessment.
                                    Only 10 full scholarship slots are available each year.
                                </p>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}
