import React from 'react';
import Navbar from '@/app/components/marketing/Navbar'; // FIXED
import Footer from '@/app/components/marketing/Footer'; // FIXED

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar theme="dark" /> 
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
