'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface WelcomeBannerProps {
  messages: string[]
  userName?: string
}

export default function WelcomeBanner({ messages, userName }: WelcomeBannerProps) {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Pick a random message on every mount (i.e., every new session/page load)
    const idx = Math.floor(Math.random() * messages.length)
    setMessage(messages[idx] ?? messages[0])
  }, [messages])

  if (!message) return null

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#002a5c] via-[#003875] to-[#0059a8] px-4 py-4 text-white shadow-lg sm:px-6 sm:py-5">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute right-16 -bottom-6 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex items-start gap-3 sm:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-10 sm:w-10">
          <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
        <div>
          {userName && (
            <p className="mb-0.5 text-[10px] font-semibold tracking-widest text-white/80 uppercase sm:text-xs">
              Good to see you, {userName}
            </p>
          )}
          <p className="text-sm leading-snug font-semibold text-white sm:text-base">{message}</p>
        </div>
      </div>
    </div>
  )
}
