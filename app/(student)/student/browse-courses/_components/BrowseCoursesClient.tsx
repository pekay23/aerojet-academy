"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ShoppingCart, Info } from 'lucide-react';

export default function BrowseCoursesClient() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/student/courses/browse')
            .then(res => res.json())
            .then(data => { setCourses(data.courses || []); setLoading(false); })
            .catch(() => { toast.error("Failed to load courses"); setLoading(false); });
    }, []);

    const handleEnroll = (courseName: string) => {
        // Placeholder for now - could link to payment or request form
        toast.info(`Enrollment for ${courseName} coming soon! Contact admin.`);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-aerojet-blue">Browse Courses</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}><CardHeader><Skeleton className="h-4 w-20" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-aerojet-blue">Browse Courses</h1>
                <p className="text-muted-foreground">Explore our available courses and expand your skills.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="font-mono mb-2">{course.code}</Badge>
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                    {course.price ? `GHS ${course.price}` : 'Free'}
                                </Badge>
                            </div>
                            <CardTitle className="text-xl">{course.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                                {course.description || "No description available."}
                            </p>
                            <div className="text-xs text-muted-foreground">
                                Duration: {course.duration || "Self-Paced"}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                            <Button className="w-full gap-2" onClick={() => handleEnroll(course.title)}>
                                <ShoppingCart className="w-4 h-4" /> Enroll Now
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
