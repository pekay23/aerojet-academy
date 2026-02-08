"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, FileText, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function CourseViewerClient({ code }: { code: string }) {
  const [data, setData] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/student/courses/${code}`)
        .then(res => res.json())
        .then(res => {
            setData(res);
            if(res.lessons?.length > 0) setActiveLesson(res.lessons[0]);
        });
  }, [code]);

  if (!data) return <div className="p-8">Loading Course...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      
      {/* LEFT: Player / Content Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 bg-black flex items-center justify-center text-white relative overflow-hidden">
            {/* Placeholder for Video/PDF */}
            <div className="text-center">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">{activeLesson?.title || "Select a Lesson"}</h2>
                <p className="text-sm text-gray-400">Content Player Placeholder</p>
            </div>
        </Card>
        <div className="mt-4">
            <h1 className="text-2xl font-bold">{data.course.title}</h1>
            <p className="text-muted-foreground">{data.course.description}</p>
        </div>
      </div>

      {/* RIGHT: Syllabus / Playlist */}
      <Card className="w-full lg:w-80 h-full overflow-y-auto">
        <div className="p-4 font-bold border-b sticky top-0 bg-card z-10">Course Content</div>
        <div className="p-2 space-y-1">
            {data.lessons?.map((lesson: any, i: number) => (
                <button 
                    key={lesson.id} 
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeLesson?.id === lesson.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                >
                    <div className="text-muted-foreground font-mono text-xs">{i+1}</div>
                    <div className="flex-1">
                        <div className="text-sm font-medium line-clamp-1">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                            <span>{lesson.type}</span> • <span>{lesson.duration}</span>
                        </div>
                    </div>
                    {/* Status Icon */}
                    <PlayCircle className="w-4 h-4 text-muted-foreground" />
                </button>
            ))}
        </div>
      </Card>

    </div>
  );
}
