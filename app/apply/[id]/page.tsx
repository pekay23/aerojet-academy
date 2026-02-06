import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import ApplyWizardClient from './_components/ApplyWizardClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const prisma = new PrismaClient();

// Force dynamic because of the [id] param
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Await the params object before accessing properties
  const { id } = await params;
  
  return {
    title: `Apply to Aerojet`,
  };
}

export default async function ApplyPage({ params }: { params: { id: string } }) {
  // Await params here too
  const { id } = await params;

  // 1. Fetch the Admission Window Logic (Using SystemSettings or Hardcoded for now if not in DB yet)
  // Since we haven't built a full 'AdmissionWindow' DB model for public links yet, 
  // we will treat this ID as a reference to a specific intake or just a generic landing for now.
  // In a full implementation, you would do:
  // const window = await prisma.examWindow.findUnique({ where: { id } });
  
  // For now, we pass the ID to the client to tag the application
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar theme="light" />
      <div className="grow flex items-center justify-center py-20 px-4">
        <ApplyWizardClient formId={id} />
      </div>
      <Footer />
    </main>
  );
}
