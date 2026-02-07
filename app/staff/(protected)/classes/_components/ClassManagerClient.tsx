"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Users, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassManagerClient() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/staff/classes')
      .then(res => res.json())
      .then(data => {
        setClasses(data.classes || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-primary"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <Button className="bg-primary text-white font-bold uppercase text-[10px] tracking-widest px-6">
            <Plus className="w-4 h-4 mr-2"/> Create New Class
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(cls => (
          <Card key={cls.id} className="bg-card border-border shadow-md hover:shadow-xl transition-all group cursor-pointer">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary uppercase">
                    {cls.code}
                </Badge>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{cls._count.students} Students</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-1">{cls.name}</h3>
              <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-6">
                Intake: {cls.intake?.name || 'General'}
              </p>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border group-hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">View Curriculum</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
