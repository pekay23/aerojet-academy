"use client";

import { School, ClipboardCheck, Plane } from "lucide-react";
import SectionReveal from "./SectionReveal";

const pathways = [
    { icon: School, title: "Classroom & Workshop Training", description: "Foundational theory and hands-on practice in our modern facilities." },
    { icon: ClipboardCheck, title: "EASA Examinations", description: "Successfully pass all required modules to prove your knowledge." },
    { icon: Plane, title: "Work Experience & Job Placement", description: "Gain required OJT and launch your career with our partner network." },
];

export default function TrainingPathways() {
  return (
    // Add `relative` and `overflow-hidden` to contain the gradient
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      
      {/* --- The Gradient Blobs --- */}
      <div 
        className="absolute top-0 left-0 w-160 h-160 bg-public-secondary rounded-full opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-0 right-0 w-160 h-160 bg-white rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2"
        aria-hidden="true"
      />

      {/* --- Main Content Container --- */}
      <div className="container mx-auto w-full px-6 relative z-10">
        <SectionReveal>
          <div className="text-center mb-16">
            <span className="text-public-secondary font-bold text-xs uppercase tracking-[0.2em] mb-3 block">Your Journey</span>
            <h2 className="text-3xl sm:text-4xl font-black text-public-primary uppercase tracking-tight">Our Training Pathways</h2>
          </div>
        </SectionReveal>
        
        <div className="relative">
          {/* Dotted line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-slate-300/70 -translate-y-1/2"></div>
          
          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-3">
            {pathways.map((pathway, index) => (
                <SectionReveal key={pathway.title} delay={index * 0.1}>
                    {/* Updated Card Style with "Glassmorphism" effect */}
                    <div className="relative text-center p-8 bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg h-full">
                        {/* FIX: Larger icon container */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 border-2 border-slate-200 shadow-md">
                            {/* FIX: Larger icon */}
                            <pathway.icon className="w-10 h-10 text-public-secondary" />
                        </div>
                        {/* FIX: Larger title */}
                        <h3 className="text-xl font-bold text-public-primary mb-3">{pathway.title}</h3>
                        {/* FIX: Larger description */}
                        <p className="text-base text-slate-600">{pathway.description}</p>
                    </div>
                </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
