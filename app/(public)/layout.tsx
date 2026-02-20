import React from "react";
import Navbar from "@/components/layouts/PublicNav";
import Footer from "@/components/layouts/PublicFooter";
import MobileStickyBar from "@/components/layouts/MobileNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}