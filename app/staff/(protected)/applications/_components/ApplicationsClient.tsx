"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Loader2, Filter } from 'lucide-react';

// Define the type for an application object
type Application = {
  id: string;
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  student: {
    user: {
      name: string;
      email: string;
    }
  };
  course: {
    title: string;
  }
};

export default function ApplicationsClient() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'>('UNDER_REVIEW');

  // Fetch data on component mount
  useEffect(() => {
    async function fetchApplications() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/staff/applications');
        if (!res.ok) throw new Error('Failed to fetch applications');
        const data = await res.json();
        setApplications(data.applications || []);
      } catch (error) {
        toast.error('Could not load applications.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplications();
  }, []);

  // Handle Approve/Reject Actions
  const handleUpdateStatus = async (applicationId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/staff/applications', {
        method: 'POST', // The API uses POST for approvals
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, newStatus }),
      });

      if (!res.ok) throw new Error(`Failed to ${newStatus.toLowerCase().replace('_', ' ')}`);
      
      // Update the UI optimistically
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      toast.success(`Application has been ${newStatus.toLowerCase()}.`);

    } catch (error) {
      toast.error('An error occurred while updating the status.');
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">Under Review</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const filteredApplications = applications.filter(app => {
      if (filter === 'ALL') return true;
      return app.status === filter;
  });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-lg">Application Queue</h3>
            {/* Add filter buttons here later */}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="hidden md:table-cell">Course</TableHead>
              <TableHead className="hidden lg:table-cell">Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.student.user.name}</div>
                    <div className="text-xs text-slate-500">{app.student.user.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{app.course.title}</TableCell>
                  <TableCell className="hidden lg:table-cell">{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    {app.status === 'UNDER_REVIEW' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700" onClick={() => handleUpdateStatus(app.id, 'APPROVED')}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" onClick={() => handleUpdateStatus(app.id, 'REJECTED')}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  No applications found for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

