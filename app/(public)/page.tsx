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
import prisma from '@/lib/prisma/client'

async function getRegistrationFee() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['registration_fee', 'registration_currency'] } },
  })
  const fee = settings.find((s) => s.key === 'registration_fee')?.value || '350'
  const currency = settings.find((s) => s.key === 'registration_currency')?.value || 'GHS'
  return { fee, currency }
}

export default async function Home() {
  const { fee, currency } = await getRegistrationFee()

  return (
    <div className="bg-white">
      <HeroSlider />
      <TrustStrip />

      {/* ===== START: REPLACEMENT "WHO WE ARE" SECTION ===== */}
      <section className="relative overflow-hidden bg-slate-50 px-6 py-24 sm:py-32">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <SectionReveal>
            <div className="relative">
              <span className="mb-4 block text-sm font-black tracking-[0.3em] text-[#4c9ded] uppercase">
                Who We Are
              </span>
              <h2 className="mb-8 text-4xl leading-[1.05] font-black tracking-tight text-[#002a5c] uppercase sm:text-5xl lg:text-6xl">
                Building the Future of <br className="hidden sm:block" />
                <span className="text-[#4c9ded]">African Aviation</span>
              </h2>

              <div className="space-y-6 text-lg leading-relaxed text-slate-600/90">
                <p className="font-medium">
                  Aerojet Aviation Training Academy is Africa’s foremost institution and leader in
                  the field of Aviation Training and Engineering. Training engineers for one of the
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

              <div className="mt-12 space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-black tracking-widest text-[#002a5c]/50 uppercase">
                  Our Training Includes:
                </p>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {[
                    'Live Hangar Experience',
                    'EASA Part-145 Standards',
                    'Global Partner Network',
                    'Hands-on Mentorship',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 font-bold text-slate-800">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.2} className="relative">
            <div className="absolute -bottom-10 -left-10 z-0 h-72 w-72 rounded-3xl border-8 border-white bg-[#002a5c] shadow-2xl" />
            <div className="relative z-10 overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src="/images/home/al4.webp"
                alt="Aerojet student"
                width={800}
                height={1000}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
            <div className="bg-public-secondary absolute -right-6 bottom-12 z-20 flex flex-col items-center justify-center rounded-2xl p-6 text-white shadow-xl">
              <span className="text-3xl font-black">100%</span>
              <span className="text-[10px] font-black tracking-widest uppercase">
                EASA Standards
              </span>
            </div>
          </SectionReveal>
        </div>
      </section>
      {/* ===== END: REPLACEMENT "WHO WE ARE" SECTION ===== */}

      <TrainingPathways />

      {/* ===== START: REPLACEMENT "PROGRAMS" SECTION ===== */}
      <section className="bg-white px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 grid items-end gap-12 lg:grid-cols-2 lg:gap-24">
            <SectionReveal>
              <div>
                <span className="mb-4 block text-sm font-black tracking-[0.3em] text-[#4c9ded] uppercase">
                  Our Programmes
                </span>
                <h2 className="mb-8 text-4xl font-black tracking-tight text-[#002a5c] uppercase sm:text-5xl lg:text-6xl">
                  Choose Your <br className="hidden sm:block" />
                  <span className="text-[#4c9ded]">Pathway</span>
                </h2>
                <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                  Whether you're starting fresh or are an experienced professional, we have a
                  program tailored to your career goals. Explore our offerings to find the perfect
                  fit for your journey in aviation.
                </p>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.1} className="flex justify-start lg:justify-end">
              <Link
                href="/courses"
                className="group flex h-16 items-center gap-4 rounded-full bg-[#002a5c] px-10 text-xs font-black tracking-[0.2em] text-white uppercase transition-all hover:bg-[#4c9ded] hover:shadow-xl"
              >
                View All Programmes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
              </Link>
            </SectionReveal>
          </div>

          <SectionReveal delay={0.2}>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <ProgramCard
                icon="graduationCap"
                title="4-Year Full-Time"
                description="Our flagship EASA-certified program for aspiring engineers. Comprehensive B1/B2 training."
                href="/courses/aircraft-engineering/easa-part-66/four-year-b1-b2"
                badge="Flagship"
                index={0}
              />
              <ProgramCard
                icon="clock"
                title="2-Year Full-Time"
                description="An accelerated B1.1 mechanical certification path focused on core engineering excellence."
                href="/courses/aircraft-engineering/easa-part-66/two-year-b1"
                index={1}
              />
              <ProgramCard
                icon="bookOpen"
                title="Modular Training"
                description="Flexible, self-paced study with expert support. Enroll in specific EASA modules as needed."
                href="/courses/aircraft-engineering/easa-part-66/modular-training"
                index={2}
              />
              <ProgramCard
                icon="users"
                title="Military / Industry"
                description="A 1-year fast-track for experienced personnel entering civil aviation maintenance."
                href="/courses/aircraft-engineering/easa-part-66/military-certification"
                index={3}
              />
            </div>
          </SectionReveal>
        </div>
      </section>
      {/* ===== END: REPLACEMENT "PROGRAMS" SECTION ===== */}

      <Careers />
      <UnderstandingLicensing />
      <EnrollmentSteps fee={fee} currency={currency} />
      <LatestNews />
      <Credibility />
      <HomeContact />
    </div>
  )
}
