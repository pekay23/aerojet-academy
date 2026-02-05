import { Metadata } from 'next';
import ResultsEntryClient from './_components/ResultsEntryClient';

export const metadata: Metadata = {
  title: 'Instructor: Publish Results',
};

export default function ResultsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Publish Results
        </h1>
        <p className="text-slate-500 mt-1">
          Enter scores for completed exam sessions.
        </p>
      </div>
      <ResultsEntryClient />
    </div>
  );
}
