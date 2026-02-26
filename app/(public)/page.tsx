import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import HeroSlider from './_components/HeroSlider'
import TrustStrip from './_components/TrustStrip'
import SectionReveal from './_components/SectionReveal'
import ProgramCard from './_components/ProgramCard'
import Careers from './_components/Careers'
import UnderstandingLicensing from './_components/UnderstandingLicensing'
import TrainingPathways from './_components/TrainingPathways'
import EnrollmentSteps from './_components/EnrollmentSteps'
import LatestNews from './_components/LatestNews'
import Credibility from './_components/Credibility'
import HomeContact from './_components/HomeContact'
import { CheckCircle2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="bg-white">
      <HeroSlider />
      <TrustStrip />

      {/* ===== START: REPLACEMENT "WHO WE ARE" SECTION ===== */}
      <section className="bg-slate-50 px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionReveal>
            <div>
              <span className="text-public-secondary mb-3 block text-xs font-bold tracking-[0.2em] uppercase">
                Who We Are
              </span>
              <h2 className="text-public-primary mb-6 text-3xl leading-[1.05] font-black tracking-tight uppercase sm:text-4xl">
                Building the Future of{' '}
                <span className="text-public-secondary">African Aviation</span>
              </h2>

              {/* FIX: Text is now better formatted and uses text-slate-600 for better readability */}
              <div className="space-y-4 text-lg leading-relaxed text-slate-600">
                <p>
                  Aerojet Aviation Training Academy is Africa’s foremost institution and leader in
                  the field of Aviation Training and Engineering. Training Engineers for one of the
                  most demanding professions in the world is a truly important responsibility that
                  we take very seriously.
                </p>
                <p>
                  At Aerojet, we are committed to educating and preparing aircraft engineers to the
                  highest standards. During your training, you will gain direct insight into how
                  work is carried out in a live aircraft hangar, supported by opportunities to train
                  in our EASA Part 145 Facility or at partner facilities worldwide.
                </p>
              </div>

              {/* FIX: Added a list of benefits for visual separation */}
              <div className="mt-8 border-t border-slate-200 pt-8">
                <p className="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
                  Our Training Includes:
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {[
                    'Live Hangar Experience',
                    'EASA Part-145 Standards',
                    'Global Partner Network',
                    'Hands-on Mentorship',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 font-medium text-slate-700">
                      <CheckCircle2 className="text-public-secondary h-4 w-4" /> {item}
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
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full rounded-2xl object-cover shadow-lg"
            />
          </SectionReveal>
        </div>
      </section>
      {/* ===== END: REPLACEMENT "WHO WE ARE" SECTION ===== */}

      <TrainingPathways />

      {/* ===== START: REPLACEMENT "PROGRAMS" SECTION ===== */}
      <section className="bg-slate-50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          {/* Use a two-column layout for the intro */}
          <div className="mb-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionReveal>
              <div>
                <span className="text-public-secondary mb-3 block text-xs font-bold tracking-[0.2em] uppercase">
                  Our Programmes
                </span>
                <h2 className="text-public-primary text-3xl font-black tracking-tight uppercase sm:text-4xl">
                  Choose Your Pathway
                </h2>
                {/* FIX: Added a descriptive paragraph for better context */}
                <p className="mt-6 text-lg leading-relaxed text-slate-600">
                  Whether you're starting fresh or are an experienced professional, we have a
                  program tailored to your career goals. Explore our offerings to find the perfect
                  fit for your journey in aviation.
                </p>
                {/* FIX: Made the link a more prominent button */}
                <Link
                  href="/courses"
                  className="bg-public-primary hover:bg-public-secondary mt-8 inline-block rounded-lg px-8 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors"
                >
                  View All Programmes
                </Link>
              </div>
            </SectionReveal>

            {/* The grid of cards now sits in the second column */}
            <SectionReveal delay={0.1}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <ProgramCard
                  icon="graduationCap"
                  title="4-Year Full-Time"
                  description="Our flagship EASA-certified program for aspiring engineers."
                  href="/courses/four-year-b1-b2"
                  badge="Flagship"
                />
                <ProgramCard
                  icon="clock"
                  title="2-Year Full-Time"
                  description="An accelerated B1.1 mechanical certification path."
                  href="/courses/two-year-b1"
                />
                <ProgramCard
                  icon="bookOpen"
                  title="Modular Training"
                  description="Flexible, self-paced study with expert support."
                  href="/courses/modular-training"
                />
                <ProgramCard
                  icon="users"
                  title="Military / Industry"
                  description="A 1-year fast-track for experienced personnel."
                  href="/courses/military-certification"
                />
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
  )
}
