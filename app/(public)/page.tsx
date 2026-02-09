import { Metadata } from 'next';
import Navbar from "@/app/components/marketing/Navbar";
import HeroSlider from "@/app/components/marketing/HeroSlider";
import Credibility from "@/app/components/marketing/Credibility";
import WhoWeAre from "@/app/components/marketing/WhoWeAre";
import ProgramsSnapshot from "@/app/components/marketing/ProgramsSnapshot";
import AdmissionsProcess from "@/app/components/marketing/AdmissionsProcess";
import PortalHighlights from "@/app/components/marketing/PortalHighlights";
import NewsroomTeaser from "@/app/components/marketing/NewsroomTeaser";
import HomeContact from "@/app/components/marketing/HomeContact";
import Footer from "@/app/components/marketing/Footer";
import Reveal from "@/app/components/marketing/Reveal";

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
          <ProgramsSnapshot />
        </Reveal>
        
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

