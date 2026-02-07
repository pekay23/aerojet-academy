import { Metadata } from 'next';
import ClassManagerClient from './_components/ClassManagerClient';

export const metadata: Metadata = {
  title: 'Staff: Class Management',
};

export default function ClassManagementPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Classes & Cohorts
        </h1>
        <p className="text-sm text-muted-foreground">
          Organize students into groups and define their semester curriculum.
        </p>
      </div>
      <ClassManagerClient />
    </div>
  );
}
