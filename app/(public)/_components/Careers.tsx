"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import SectionReveal from "./SectionReveal";

const careerPoints = [
  "Commercial Airlines",
  "Maintenance, Repair & Overhaul (MRO) Facilities",
  "Aircraft Manufacturing Companies",
  "Military and Defence Contractors",
  "Specialist Engineering Firms",
];

export default function Careers() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionReveal>
            <Image
              src="/images/careers/aircraftcareers.jpg" 
              alt="Aircraft Engineer working on an engine"
              width={600}
              height={700}
              className="rounded-2xl object-cover"
            />
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div>
              <span className="text-public-secondary font-bold text-xs uppercase tracking-[0.2em] mb-3 block">
                Career Opportunities
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-public-primary uppercase tracking-tight mb-6">
                A Career That Takes You Anywhere
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8">
                An EASA Part-66 license is a globally recognized qualification that opens doors to a rewarding and high-demand career. Our graduates work in a variety of roles across the aviation industry worldwide, including:
              </p>
              <ul className="space-y-4">
                {careerPoints.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-public-secondary" />
                    <span className="text-slate-700 font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
