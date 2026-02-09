"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function ReportsClient() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/staff/reports').then(res => res.json()).then(setData);
  }, []);

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">System Reports</h1>
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">€{data?.totalRevenue || 0}</div>
                    <p className="text-xs text-muted-foreground">Lifetime collected fees</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
