import { Metadata } from 'next'
import Hero from '../_components/Hero'
import SectionReveal from '../_components/SectionReveal'
import ContactForm from './_components/ContactForm'

export const metadata: Metadata = { title: 'Contact ' }

export default function ContactPage() {
  return (
    <div className="bg-slate-50">
      <Hero
        title="Contact Us"
        subtitle="Reach out to our admissions team for enquiries about EASA programmes."
        backgroundImage="/images/hero/contact-hero.webp"
      />

      <div className="relative z-20 mx-auto -mt-20 max-w-7xl px-6 py-16">
        <SectionReveal>
          <div className="grid overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl sm:rounded-3xl lg:grid-cols-5">
            {/* Info Side */}
            <div className="bg-aerojet-blue p-8 text-white sm:p-10 lg:col-span-2">
              <h2 className="mb-8 border-b border-white/10 pb-4 text-2xl font-black tracking-widest uppercase">
                Get in Touch
              </h2>
              <div className="space-y-7">
                {[
                  {
                    emoji: '📍',
                    label: 'Campus Location',
                    value: 'ATTC Small Engines Department,\nKokomlemle, Accra, Ghana',
                  },
                  { emoji: '📞', label: 'Admissions Line', value: '+233-20-984-8423' },
                  {
                    emoji: '✉️',
                    label: 'Official Email',
                    value: 'trainingprograms@aerojet-academy.com',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      {item.emoji}
                    </div>
                    <div>
                      <h3 className="text-aerojet-sky mb-1 text-sm font-bold tracking-widest uppercase">
                        {item.label}
                      </h3>
                      <p className="text-base leading-relaxed whitespace-pre-line text-slate-300">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative mt-10 h-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 opacity-70 grayscale">
                <iframe
                  title="Google Maps - Accra Technical Training Centre"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.786377777076!2d-0.2085864241476562!3d5.598254333214875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf90a079636901%3A0x8772a4667556553a!2sAccra%20Technical%20Training%20Centre!5e0!3m2!1sen!2sgh!4v1709220000000!5m2!1sen!2sgh"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>

            {/* Form Side */}
            <div className="p-8 sm:p-10 lg:col-span-3">
              <h2 className="text-aerojet-blue mb-2 text-3xl font-black tracking-tight uppercase">
                Send us a Message
              </h2>
              <p className="mb-8 text-base text-slate-500">
                Fill out the form below and we will get back to you via email.
              </p>
              <ContactForm />
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
