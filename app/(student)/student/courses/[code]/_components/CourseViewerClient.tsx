"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CourseViewerClient({ code }: { code: string }) {
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/courses/${code}`)
        .then(res => res.json())
        .then(res => {
            if (res.course) {
                setCourse(res.course);
                if(res.course.lessons?.length > 0) setActiveLesson(res.course.lessons[0]);
            } else {
                toast.error("Course not found or not enrolled.");
            }
            setLoading(false);
        })
        .catch(() => {
            toast.error("Failed to load course data.");
            setLoading(false);
        });
  }, [code]);

  const handleNav = (direction: 'next' | 'prev') => {
    if (!course?.lessons) return;
    const currentIndex = course.lessons.findIndex((l: any) => l.id === activeLesson.id);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < course.lessons.length) {
        setActiveLesson(course.lessons[nextIndex]);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-aerojet-blue"/></div>;
  if (!course) return <div className="p-8 text-center text-muted-foreground">Could not load course details.</div>;

  const currentIndex = course.lessons?.findIndex((l: any) => l.id === activeLesson?.id) ?? 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      
      {/* LEFT: Player Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 bg-black flex items-center justify-center text-white relative overflow-hidden">
            <div className="text-center p-4">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">{activeLesson?.title || "Select a Lesson"}</h2>
                <p className="text-sm text-gray-400">Content Player Placeholder</p>
            </div>
        </Card>

        {/* Lesson Header & Nav */}
        <div className="mt-4 p-4 rounded-lg bg-card border">
            <h1 className="text-xl font-bold">{activeLesson?.title || course.title}</h1>
            <p className="text-muted-foreground text-sm">{course.code}</p>
            <div className="flex justify-between items-center mt-4">
                <Button variant="outline" onClick={() => handleNav('prev')} disabled={currentIndex === 0}>
                    <ArrowLeft className="w-4 h-4 mr-2"/> Previous
                </Button>
                <Button onClick={() => handleNav('next')} disabled={currentIndex >= course.lessons.length - 1}>
                    Next <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
            </div>
        </div>
      </div>

      {/* RIGHT: Syllabus */}
      <Card className="w-full lg:w-96 h-full overflow-y-auto">
        <div className="p-4 font-bold border-b sticky top-0 bg-card z-10">Course Content ({course.lessons?.length || 0})</div>
        <div className="p-2 space-y-1">
            {course.lessons?.map((lesson: any, i: number) => (
                <button 
                    key={lesson.id} 
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeLesson?.id === lesson.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                >
                    <div className="text-muted-foreground font-mono text-xs">{String(i+1).padStart(2, '0')}</div>
                    <div className="flex-1">
                        <div className="text-sm font-medium line-clamp-1">{lesson.title}</div>
                    </div>
                    <PlayCircle className="w-4 h-4 text-muted-foreground" />
                </button>
            ))}
        </div>
      </Card>
    </div>
  );
}
