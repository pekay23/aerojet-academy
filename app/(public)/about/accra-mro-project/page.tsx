import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '../../_components/Hero'
import SectionReveal from '../../_components/SectionReveal'

export const metadata: Metadata = { title: 'Accra MRO Project | Aerojet Academy' }

export default function MROPage() {
  return (
    <div className="bg-white">
      <Hero
        title="Accra MRO Project"
        subtitle="Establishing West Africa's premier Maintenance, Repair, and Overhaul hub."
        backgroundImage="/images/hero/hanger.jpg"
      />

      <div className="mx-auto max-w-4xl space-y-12 px-6 py-20">
        <SectionReveal>
          <section>
            <div className="mb-5 h-1.5 w-14 rounded-full bg-[#4c9ded]" />
            <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-[#002a5c]">
              Vision & Purpose
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-slate-600">
              The Accra MRO Project is a flagship initiative by Aerojet Aviation to position Ghana
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
              <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-[#002a5c]">
                Local Capacity
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                By building a world-class facility in Accra, we are solving the critical gap in
                local maintenance infrastructure.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
              <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-[#002a5c]">
                Economic Impact
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                The project is expected to create hundreds of direct high-skilled jobs and thousands
                of indirect opportunities.
              </p>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <section className="rounded-2xl bg-[#002a5c] p-8 text-white shadow-2xl sm:rounded-3xl sm:p-14">
            <h2 className="mb-5 text-2xl font-black uppercase">The Role of the Academy</h2>
            <p className="mb-8 leading-relaxed text-blue-100/80">
              A world-class MRO facility requires world-class engineers. Aerojet Academy was
              established as the primary human-capital engine for this project, ensuring that every
              technician is trained to international EASA Part-66 standards.
            </p>
            <Link
              href="/about"
              className="inline-block rounded-xl bg-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#002a5c] transition-all hover:bg-[#4c9ded] hover:text-white"
            >
              Learn More About the Academy
            </Link>
          </section>
        </SectionReveal>
      </div>
    </div>
  )
}
