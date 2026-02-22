import Image from 'next/image'

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="relative mb-8">
        <div className="bg-public-secondary/20 absolute inset-0 animate-ping rounded-full" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white shadow-lg">
          <Image
            src="/images/logos/AATA_logo_hor_onWhite.png"
            alt="Aerojet"
            width={40}
            height={40}
            className="h-10 w-10 animate-pulse object-contain"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="bg-public-primary h-1 w-1 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <div className="bg-public-primary h-1 w-1 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <div className="bg-public-primary h-1 w-1 animate-bounce rounded-full" />
        </div>
        <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
          Preparing for Takeoff
        </p>
      </div>
    </div>
  )
}
