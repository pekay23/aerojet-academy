import { Metadata } from 'next';
import ReportsClient from './_components/ReportsClient';

export const metadata: Metadata = {
  title: 'Reports & Analytics',
};

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate transcripts, view attendance trends, and analyze student performance.
        </p>
      </div>
      <ReportsClient />
    </div>
  );
}
