import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import Link from 'next/link';
import { BookOpen, MonitorPlay, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Examination Only',
  description: 'Sit for EASA Part-66 Exams with Aerojet Academy.',
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
                
                {/* LEFT CONTENT */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Self-Study & Exams</h2>
                        <p className="text-lg text-slate-700 leading-relaxed mb-6">
                            The Exam Only option is ideal for our customers who are very confident studying on their own and require no tuition support. 
                            Candidates for this will usually get learning materials for the booked module and be able to book exam slots at their convenience.
                        </p>
                        <p className="text-slate-700 mb-6 font-medium">
                            Aerojet’s facility is a <strong>Certified EASA Part 147 Facility</strong> and as such all-EASA Examination rules apply.
                        </p>
                        
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-8">
                            <h3 className="font-bold text-aerojet-blue mb-4 text-lg">What is Included?</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                The package is comprehensive. When you book a module, the following are all included:
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                        <BookOpen className="w-5 h-5 text-[#4c9ded]" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">Exam Fee & Learning Materials</h5>
                                        <p className="text-xs text-slate-500">Full access to study guides and the examination sitting.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                        <MonitorPlay className="w-5 h-5 text-[#4c9ded]" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">1 Online Prep Session</h5>
                                        <p className="text-xs text-slate-500">One online prep session included in the package.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-blue-200">
                                <p className="text-sm text-slate-700 flex gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-[#4c9ded] shrink-0" />
                                    <span>
                                        <strong>Bonus:</strong> Students who book with us can benefit from some online info sessions for the modules they book as a <em>complimentary addition</em> to aid their exam preparation.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">How to Book with Us</h3>
                        <div className="space-y-4">
                             <div className="flex gap-4">
                                <span className="font-black text-[#4c9ded] text-xl">01.</span>
                                <p className="text-slate-700 text-sm">Pay and Register with the Training Academy.</p>
                             </div>
                             <div className="flex gap-4">
                                <span className="font-black text-[#4c9ded] text-xl">02.</span>
                                <p className="text-slate-700 text-sm">Log in with your credentials.</p>
                             </div>
                             <div className="flex gap-4">
                                <span className="font-black text-[#4c9ded] text-xl">03.</span>
                                <p className="text-slate-700 text-sm">Browse any course you want and buy your preferred course when ready.</p>
                             </div>
                             <div className="flex gap-4">
                                <span className="font-black text-[#4c9ded] text-xl">04.</span>
                                <p className="text-slate-700 text-sm">Book your exam date, course start date, or classroom tuition session slots using the scheduled slots available.</p>
                             </div>
                        </div>
                    </section>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="space-y-8">
                     <div className="p-8 rounded-3xl bg-aerojet-blue text-white shadow-xl relative overflow-hidden">
                          <div className="relative z-10">
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Student Portal</span>
                            <div className="text-3xl font-black mt-2 mb-1">Book an Exam</div>
                            <p className="text-sm opacity-80 mt-4 mb-8">
                                Gaining access to our portal only requires a one-time registration. Once you are registered, you have <strong>lifetime access</strong> to buy and book as many courses as you wish.
                            </p>
                            <Link href="/register" className="block w-full text-center bg-[#4c9ded] text-white mt-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-aerojet-blue transition-all">
                                Book Now
                            </Link>
                          </div>
                     </div>
                </div>

             </div>
        </div>
      </div>
    </main>
  );
}
