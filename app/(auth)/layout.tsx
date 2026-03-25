import Image from 'next/image'
import Link from 'next/link'
import { AuthThemeProvider } from '@/components/shared/AuthThemeProvider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthThemeProvider>
      <div className="flex min-h-screen">
        {/* Left branding panel - hidden on mobile */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-aerojet-blue p-12 lg:flex lg:w-[45%] xl:w-[40%]">
          <div className="absolute inset-0 bg-linear-to-br from-aerojet-blue via-[#003a7c] to-[#001a3c]" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: 'url(/images/hero/registration.webp)' }}
          />
          <div className="relative z-10">
            <Link href="/" className="mb-20 flex items-center gap-3">
              <Image
                src="/images/logos/ATA_logo_hor_onDark.webp"
                alt="Aerojet Academy"
                width={160}
                height={40}
                className="object-contain"
              />
            </Link>
            <h1 className="max-w-md text-4xl leading-[1.05] font-black tracking-tight text-white uppercase xl:text-5xl">
              Your Aviation Career Starts Here
            </h1>
            <p className="mt-6 max-w-sm leading-relaxed text-blue-100/60">
              EASA Part-66 certified aircraft maintenance engineering programmes. Build a career
              that takes you anywhere in the world.
            </p>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4">
              {[
                { value: 'EASA', label: 'Part 147 Certified' },
                { value: 'B1 & B2', label: 'Licence Categories' },
                { value: '28', label: 'Max Class Size' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 rounded-xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-md"
                >
                  <span className="block text-lg font-black text-white">{stat.value}</span>
                  <span className="text-[9px] font-bold tracking-widest text-blue-200/50 uppercase">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white p-4 lg:hidden">
            <Link href="/">
              <Image
                src="/images/logos/AATA_logo_hor_onWhite.webp"
                alt="Aerojet Academy"
                width={120}
                height={30}
                className="object-contain"
              />
            </Link>
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 transition-colors hover:text-slate-600"
            >
              ← Back to site
            </Link>
          </div>

          {/* Form area */}
          <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-xl">{children}</div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 p-6 text-center">
            <p className="text-[10px] tracking-widest text-slate-400 uppercase">
              &copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </AuthThemeProvider>
  )
}
