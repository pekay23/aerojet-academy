import { Metadata } from 'next';
import Link from 'next/link';

// Components
import HeroSlider from "@/app/components/marketing/HeroSlider";
import Credibility from "@/app/components/marketing/Credibility";
import WhoWeAre from "@/app/components/marketing/WhoWeAre";
import ProgrammeTabs from "@/app/components/marketing/ProgrammeTabs"; 
import PortalHighlights from "@/app/components/marketing/PortalHighlights";
import NewsroomTeaser from "@/app/components/marketing/NewsroomTeaser";
import HomeContact from "@/app/components/marketing/HomeContact";
import Reveal from "@/app/components/marketing/Reveal";
import AdmissionsProcess from "@/app/components/marketing/AdmissionsProcess"; // ✅ RESTORED IMPORT

export const metadata: Metadata = {
  // Title is set by default/template in layout.tsx
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      
      <div className="grow">
        <HeroSlider />
        
        <Reveal>
          <Credibility />
        </Reveal>
        
        <Reveal delay={200}>
          <WhoWeAre />
        </Reveal>
        
        <Reveal>
          <ProgrammeTabs />
        </Reveal>
        
        {/* ✅ RESTORED AdmissionsProcess */}
        <Reveal>
          <AdmissionsProcess />
        </Reveal>
        
        <Reveal>
          <PortalHighlights />
        </Reveal>
        
        <Reveal>
          <NewsroomTeaser />
        </Reveal>
        
        <Reveal>
          <HomeContact />
        </Reveal>
      </div>
    </main>
  );
}
