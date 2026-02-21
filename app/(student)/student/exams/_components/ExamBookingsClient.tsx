"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExamBookingsClient() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/exams').then(res=>res.json()).then(data => { setBookings(data.bookings || []); setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-aerojet-blue">My Booked Exams</h1>
      {bookings.length === 0 ? <div className="p-8 text-center border-dashed border bg-white">No upcoming exams.</div> : (
        <div className="grid gap-4">
            {bookings.map((b) => (
                <Card key={b.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{b.pool.name}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {new Date(b.pool.examDate).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {b.pool.examStartTime}</span>
                            </div>
                        </div>
                        <Badge>{b.status}</Badge>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
