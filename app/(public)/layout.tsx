import React from 'react'
import Navbar from '@/components/layouts/PublicNav'
import Footer from '@/components/layouts/PublicFooter'
import MobileStickyBar from '@/components/layouts/MobileNav'
import { getAdvisoryConfig } from '@/lib/settings'
import AdvisoryBanner from './_components/AdvisoryBanner'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const advisory = await getAdvisoryConfig()

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-slate-900">
      {advisory.enabled && advisory.message && <AdvisoryBanner message={advisory.message} />}
      <Navbar />
      <main id="main-content" className="relative w-full flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
