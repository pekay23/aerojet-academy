import { Metadata } from 'next';
import SettingsClient from './_components/SettingsClient';

export const metadata: Metadata = {
  title: 'System Settings | Admin Console',
};

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          System Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure global academy rules and notification preferences.
        </p>
      </div>

      {/* Render the interactive Client Component */}
      <SettingsClient />
    </div>
  );
}
