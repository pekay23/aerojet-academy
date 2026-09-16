import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'

export const metadata: Metadata = { title: 'Accra MRO Project ' }

export default function MROPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Accra MRO Project"
        subtitle="Establishing West Africa's premier Maintenance, Repair, and Overhaul hub."
        backgroundImage="/images/hero/hanger.webp"
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-20">
        <SectionReveal>
          <section>
            <div className="bg-aerojet-sky mb-5 h-1.5 w-14 rounded-full" />
            <h2 className="text-aerojet-blue mb-6 text-3xl font-black tracking-tight uppercase">
              Vision & Purpose
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-slate-600">
              The{' '}
              <a
                href="https://aerojet-aviation.com/accra-mro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-aerojet-blue font-semibold hover:underline"
              >
                Accra MRO Project
              </a>{' '}
              is a flagship initiative by Aerojet Aviation to position Ghana
              as the primary aviation technical hub for the West African sub-region.
            </p>
            <p className="leading-relaxed text-slate-500">
              Currently, a significant percentage of heavy aircraft maintenance for regional
              carriers is performed outside of Africa. This project aims to localise those services,
              reducing operational costs for airlines and retaining economic value within the
              continent.
            </p>
          </section>
        </SectionReveal>

        <SectionReveal>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
              <h3 className="text-aerojet-blue mb-3 text-base font-black tracking-widest uppercase">
                Local Capacity
              </h3>
              <p className="text-base leading-relaxed text-slate-600">
                By building a world-class facility in Accra, we are solving the critical gap in
                local maintenance infrastructure.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
              <h3 className="text-aerojet-blue mb-3 text-base font-black tracking-widest uppercase">
                Economic Impact
              </h3>
              <p className="text-base leading-relaxed text-slate-600">
                The project is expected to create hundreds of direct high-skilled jobs and thousands
                of indirect opportunities.
              </p>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <section className="bg-aerojet-blue rounded-2xl p-8 text-white shadow-2xl sm:rounded-3xl sm:p-14">
            <h2 className="mb-5 text-2xl font-black uppercase">The Role of the Academy</h2>
            <p className="mb-8 leading-relaxed text-blue-100/80">
              A world-class MRO facility requires world-class engineers. Aerojet Academy was
              established as the primary human-capital engine for this project, ensuring that every
              technician is trained to international EASA Part-66 standards.
            </p>
            <Link
              href="/about"
              className="text-aerojet-blue hover:bg-aerojet-sky inline-block rounded-xl bg-white px-8 py-3 text-sm font-black tracking-[0.2em] uppercase transition-all hover:text-white"
            >
              Learn More About the Academy
            </Link>
          </section>
        </SectionReveal>
      </div>
    </div>
  )
}
