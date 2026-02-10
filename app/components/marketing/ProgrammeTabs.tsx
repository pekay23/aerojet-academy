"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';

const EASA_PROGRAMS = [
    { title: "Full-Time B1.1 & B2", desc: "4 Years • Comprehensive theory & hand-skills.", href: "/courses/easa-full-time" },
    { title: "Full-Time B1.1", desc: "2 Years • Accelerated mechanical path.", href: "/courses/easa-full-time" },
    { title: "12-Month Certification", desc: "For Industry/Military professionals.", href: "/courses/easa-full-time" },
    { title: "Modular Training", desc: "Book modules at your own pace.", href: "/courses/easa-modular" },
    { title: "Examination Only", desc: "Self-study with exam pool access.", href: "/courses/examination-only" },
    { title: "Revision Support", desc: "Mocks & Targeted Clinics.", href: "/courses/revision-support" },
];

export default function ProgrammeTabs() {
  return (
    <section className="w-full py-24 bg-slate-50" id="programmes">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-blue-50 to-transparent opacity-50 pointer-events-none" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Our Training Pathways</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Select a category to explore our world-class aviation training options.</p>
        </div>

        <Tabs defaultValue="easa" className="w-full max-w-6xl mx-auto">
            <div className="flex justify-center mb-12 overflow-x-auto pb-4">
                <TabsList className="bg-slate-100 p-1 rounded-full inline-flex">
                    <TabsTrigger value="easa" className="rounded-full px-6 py-3 text-sm font-bold data-[state=active]:bg-aerojet-blue data-[state=active]:text-white">EASA Part-66 License</TabsTrigger>
                    <TabsTrigger value="skilled" className="rounded-full px-6 py-3 text-sm font-bold data-[state=active]:bg-aerojet-blue data-[state=active]:text-white">Skilled Training</TabsTrigger>
                    <TabsTrigger value="short" className="rounded-full px-6 py-3 text-sm font-bold data-[state=active]:bg-aerojet-blue data-[state=active]:text-white">Short Courses</TabsTrigger>
                    <TabsTrigger value="experience" className="rounded-full px-6 py-3 text-sm font-bold data-[state=active]:bg-aerojet-blue data-[state=active]:text-white">Work Experience</TabsTrigger>
                </TabsList>
            </div>

            {/* TAB 1: EASA */}
            <TabsContent value="easa" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {EASA_PROGRAMS.map((prog, i) => (
                        <div key={i} className="group p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-[#4c9ded] transition-all duration-300 flex flex-col">
                            <h3 className="text-xl font-bold text-aerojet-blue mb-2 group-hover:text-[#4c9ded] transition-colors">{prog.title}</h3>
                            <p className="text-slate-500 mb-6 flex-1 text-sm">{prog.desc}</p>
                            <div className="flex gap-3 mt-auto">
                                <Link href={prog.href} className="flex-1 text-center py-3 rounded-lg bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wide hover:bg-gray-100">Details</Link>
                                <Link href="/register" className="flex-1 text-center py-3 rounded-lg bg-aerojet-blue text-white font-bold text-xs uppercase tracking-wide hover:bg-aerojet-sky">Apply</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </TabsContent>

            {/* TAB 2: SKILLED TRAINING */}
            <TabsContent value="skilled" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-300">
                    <h3 className="text-2xl font-bold text-aerojet-blue mb-4">Skilled Training Courses</h3>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto"> Specialized practical training for specific aviation tasks. (Information to be added soon).</p>
                    <button className="px-8 py-3 bg-[#4c9ded] text-white rounded-full font-bold opacity-50 cursor-not-allowed">Coming Soon</button>
                </div>
            </TabsContent>

            {/* TAB 3: SHORT COURSES */}
            <TabsContent value="short" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-300 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                        <div className="bg-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 border border-slate-100">
                            <Lock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Coming Soon</span>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-aerojet-blue mb-4 opacity-50">Certified Short Knowledge Courses</h3>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto">Short-duration certification for industry professionals.</p>
                </div>
            </TabsContent>

            {/* TAB 4: WORK EXPERIENCE */}
            <TabsContent value="experience" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-300 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                        <div className="bg-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 border border-slate-100">
                            <Lock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Coming Soon</span>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-aerojet-blue mb-4 opacity-50">Aircraft Work Experience Program</h3>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto">Structured OJT opportunities with partner MROs.</p>
                </div>
            </TabsContent>

        </Tabs>
      </div>
    </section>
  );
}
