import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import Credibility from "@/components/Credibility";
import WhoWeAre from "@/components/WhoWeAre";
import ProgramsSnapshot from "@/components/ProgramsSnapshot";
import AdmissionsProcess from "@/components/AdmissionsProcess";
import PortalHighlights from "@/components/PortalHighlights";
import NewsroomTeaser from "@/components/NewsroomTeaser";
import HomeContact from "@/components/HomeContact";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal"; // Import Reveal

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
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
      
      <Footer />
    </main>
  );
}
