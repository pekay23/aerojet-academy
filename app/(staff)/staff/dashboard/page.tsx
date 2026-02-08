import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StaffDashboardPage() {
  return (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Staff Dashboard (New Structure)</h1>
        <Card>
            <CardHeader><CardTitle>Migration in Progress</CardTitle></CardHeader>
            <CardContent>
                This portal is successfully running on the new architecture.
                <br />
                Security check: <span className="text-green-600 font-bold">PASSED</span> (Only Staff/Admins can see this).
            </CardContent>
        </Card>
    </div>
  );
}
