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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002a5c] via-[#003875] to-[#0059a8] px-6 py-5 text-white shadow-lg">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-6 right-16 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          {userName && (
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-white/60">
              Good to see you, {userName}
            </p>
          )}
          <p className="text-base font-semibold leading-snug text-white">{message}</p>
        </div>
      </div>
    </div>
  )
}
