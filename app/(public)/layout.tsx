import React from 'react';
import Navbar from '@/components/marketing/Navbar'; // FIXED
import Footer from '@/components/marketing/Footer'; // FIXED
import MobileStickyBar from "@/components/marketing/MobileStickyBar";
import ScrollToTop from "@/components/marketing/ScrollToTop";
import { CommandMenu } from '@/components/marketing/CommandMenu';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar theme="dark" />
      <CommandMenu />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
      <MobileStickyBar />
    </div>
  );
}
