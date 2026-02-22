import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <Link href="/" className="mb-12">
        <Image
          src="/images/logos/AATA_logo_hor_onWhite.png"
          alt="Aerojet Academy"
          width={180}
          height={40}
          className="h-auto w-auto"
          priority
        />
      </Link>

      <div className="w-full max-w-md space-y-6 rounded-4xl border border-slate-100 bg-white p-12 text-center shadow-xl">
        <div className="space-y-2">
          <h1 className="text-public-primary text-8xl font-black tracking-tighter">404</h1>
          <h2 className="text-2xl leading-none font-black tracking-tight text-slate-800 uppercase">
            Flight Path Not Found
          </h2>
        </div>

        <p className="text-sm leading-relaxed font-medium text-slate-600">
          The page you are looking for does not exist or has been moved to a new terminal.
        </p>

        <div className="pt-4">
          <Link
            href="/"
            className="bg-public-primary hover:bg-public-secondary inline-flex h-12 items-center justify-center rounded-xl px-8 text-xs font-black tracking-widest text-white uppercase transition-all hover:shadow-lg active:scale-95"
          >
            Go to Homepage
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
        &copy; {new Date().getFullYear()} Aerojet Aviation Training Academy
      </p>
    </div>
  )
}
