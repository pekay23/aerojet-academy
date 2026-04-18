import React from 'react'
import Navbar from '@/components/layouts/PublicNav'
import Footer from '@/components/layouts/PublicFooter'
import MobileStickyBar from '@/components/layouts/MobileNav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />
      <main id="main-content" className="relative w-full flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
