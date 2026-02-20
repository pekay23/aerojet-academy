import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HeroSlider from './_components/HeroSlider';
import TrustStrip from './_components/TrustStrip';
import SectionReveal from './_components/SectionReveal';
import ProgramCard from './_components/ProgramCard';
import Careers from './_components/Careers';
import UnderstandingLicensing from './_components/UnderstandingLicensing';
import TrainingPathways from './_components/TrainingPathways';
import EnrollmentSteps from './_components/EnrollmentSteps';
import LatestNews from './_components/LatestNews';
import Credibility from './_components/Credibility';
import HomeContact from './_components/HomeContact';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white">
      <HeroSlider />
      <TrustStrip />

      {/* ===== START: REPLACEMENT "WHO WE ARE" SECTION ===== */}
      <section className="bg-slate-50 py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <SectionReveal>
            <div>
              <span className="text-public-secondary font-bold text-xs uppercase tracking-[0.2em] mb-3 block">Who We Are</span>
              <h2 className="text-3xl sm:text-4xl font-black text-public-primary uppercase tracking-tight mb-6 leading-[1.05]">
                Building the Future of <span className="text-public-secondary">African Aviation</span>
              </h2>
              
              {/* FIX: Text is now better formatted and uses text-slate-600 for better readability */}
              <div className="space-y-4 text-slate-600 leading-relaxed text-lg">
                <p>
                  Aerojet Aviation Training Academy is Africa’s foremost institution and leader in the field of Aviation Training and Engineering. Training Engineers for one of the most demanding professions in the world is a truly important responsibility that we take very seriously.
                </p>
                <p>
                  At Aerojet, we are committed to educating and preparing aircraft engineers to the highest standards. During your training, you will gain direct insight into how work is carried out in a live aircraft hangar, supported by opportunities to train in our EASA Part 145 Facility or at partner facilities worldwide.
                </p>
              </div>

              {/* FIX: Added a list of benefits for visual separation */}
              <div className="pt-8 mt-8 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Our Training Includes:</p>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {['Live Hangar Experience', 'EASA Part-145 Standards', 'Global Partner Network', 'Hands-on Mentorship'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-public-secondary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <Image
              src="/images/home/al4.jpeg"
              alt="Aerojet student"
              width={600}
              height={700} // Making the image slightly taller for better composition
              className="rounded-2xl object-cover w-full h-full shadow-lg"
            />
          </SectionReveal>
        </div>
      </section>
      {/* ===== END: REPLACEMENT "WHO WE ARE" SECTION ===== */}

      <TrainingPathways />

      {/* ===== START: REPLACEMENT "PROGRAMS" SECTION ===== */}
      <section className="py-20 sm:py-28 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {/* Use a two-column layout for the intro */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <SectionReveal>
              <div>
                <span className="text-public-secondary font-bold text-xs uppercase tracking-[0.2em] mb-3 block">Our Programmes</span>
                <h2 className="text-3xl sm:text-4xl font-black text-public-primary uppercase tracking-tight">
                  Choose Your Pathway
                </h2>
                {/* FIX: Added a descriptive paragraph for better context */}
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  Whether you're starting fresh or are an experienced professional, we have a program tailored to your career goals. Explore our offerings to find the perfect fit for your journey in aviation.
                </p>
                {/* FIX: Made the link a more prominent button */}
                <Link href="/courses" className="inline-block mt-8 bg-public-primary text-white px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-public-secondary transition-colors">
                  View All Programmes
                </Link>
              </div>
            </SectionReveal>

            {/* The grid of cards now sits in the second column */}
            <SectionReveal delay={0.1}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ProgramCard icon="graduationCap" title="4-Year Full-Time" description="Our flagship EASA-certified program for aspiring engineers." href="/courses/four-year-b1-b2" badge="Flagship" />
                <ProgramCard icon="clock" title="2-Year Full-Time" description="An accelerated B1.1 mechanical certification path." href="/courses/two-year-b1" />
                <ProgramCard icon="bookOpen" title="Modular Training" description="Flexible, self-paced study with expert support." href="/courses/modular-training" />
                <ProgramCard icon="users" title="Military / Industry" description="A 1-year fast-track for experienced personnel." href="/courses/military-certification" />
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>
      {/* ===== END: REPLACEMENT "PROGRAMS" SECTION ===== */}

      <Careers />
      <UnderstandingLicensing />
      <EnrollmentSteps />
      <LatestNews />
      <Credibility />
      <HomeContact />
    </div>
  );
}
