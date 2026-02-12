
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, FileText, Check, ChevronsUpDown, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Instructor {
    id: string;
    name: string;
    email: string;
}

interface Course {
    id: string;
    title: string;
    code: string;
}

interface CohortCourse {
    id: string;
    course: Course;
    instructors: Instructor[]; // Changed from instructorId
}

interface Cohort {
    id: string;
    name: string;
    curriculum: CohortCourse[];
}

interface Intake {
    id: string;
    name: string;
    cohorts: Cohort[];
}

export default function AssignmentClient() {
    const [intakes, setIntakes] = useState<Intake[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedIntakeId, setSelectedIntakeId] = useState<string>("");
    const [selectedCohortId, setSelectedCohortId] = useState<string>("");

    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/assignments/data');
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setIntakes(data.intakes || []);
            setInstructors(data.instructors || []);

            // Auto-select first intake/cohort if available
            if (data.intakes?.length > 0) {
                setSelectedIntakeId(data.intakes[0].id);
                if (data.intakes[0].cohorts?.length > 0) {
                    setSelectedCohortId(data.intakes[0].cohorts[0].id);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load assignment data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (cohortCourseId: string, updatedInstructorIds: string[]) => {
        setSavingId(cohortCourseId);
        try {
            const res = await fetch('/api/admin/assignments/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cohortCourseId, instructorIds: updatedInstructorIds })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');

            // Update local state
            // We need to resolve the full instructor objects for the UI
            const newInstructors = instructors.filter(i => updatedInstructorIds.includes(i.id));

            setIntakes(prev => prev.map(intake => ({
                ...intake,
                cohorts: intake.cohorts.map(cohort => ({
                    ...cohort,
                    curriculum: cohort.curriculum.map(cc =>
                        cc.id === cohortCourseId ? { ...cc, instructors: newInstructors } : cc
                    )
                }))
            })));

            toast.success('Instructors updated successfully');
        } catch (error) {
            toast.error('Failed to update instructors');
        } finally {
            setSavingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const selectedIntake = intakes.find(i => i.id === selectedIntakeId);
    const selectedCohort = selectedIntake?.cohorts.find(c => c.id === selectedCohortId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Course Assignments</h1>
                    <p className="text-slate-500">Assign instructors to cohort courses</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3 md:pb-3">
                        <CardTitle className="text-sm font-medium uppercase text-slate-500">Select Intake</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select
                            className="w-full h-10 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            value={selectedIntakeId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setSelectedIntakeId(id);
                                // Reset cohort when intake changes
                                const intake = intakes.find(i => i.id === id);
                                if (intake && intake.cohorts.length > 0) {
                                    setSelectedCohortId(intake.cohorts[0].id);
                                } else {
                                    setSelectedCohortId("");
                                }
                            }}
                        >
                            <option value="" disabled>Choose an intake...</option>
                            {intakes.map(intake => (
                                <option key={intake.id} value={intake.id}>{intake.name}</option>
                            ))}
                        </select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 md:pb-3">
                        <CardTitle className="text-sm font-medium uppercase text-slate-500">Select Cohort</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select
                            className="w-full h-10 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            value={selectedCohortId}
                            onChange={(e) => setSelectedCohortId(e.target.value)}
                            disabled={!selectedIntakeId}
                        >
                            <option value="" disabled>Choose a cohort...</option>
                            {selectedIntake?.cohorts.map(cohort => (
                                <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                            ))}
                        </select>
                    </CardContent>
                </Card>
            </div>

            {selectedCohort ? (
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-500" />
                            Curriculum for <span className="text-aerojet-blue">{selectedCohort.name}</span>
                        </CardTitle>
                        <CardDescription>
                            {selectedCohort.curriculum.length} courses listed. Assign instructors to each.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-visible rounded-md border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Course</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[40%]">Assigned Instructors</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {selectedCohort.curriculum.map((item) => {
                                        const assignedIds = item.instructors.map(i => i.id);

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap align-top">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">{item.course.title}</span>
                                                        <span className="text-xs text-slate-500">{item.course.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="w-full justify-between font-normal min-h-[40px] h-auto py-2"
                                                                disabled={savingId === item.id}
                                                            >
                                                                {item.instructors.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.instructors.map(inst => (
                                                                            <Badge key={inst.id} variant="secondary" className="mr-1 mb-1 font-normal">
                                                                                {inst.name}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground italic">Select instructors...</span>
                                                                )}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto">
                                                            <DropdownMenuLabel>Instructors</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {instructors.map((inst) => (
                                                                <DropdownMenuCheckboxItem
                                                                    key={inst.id}
                                                                    checked={assignedIds.includes(inst.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        const newIds = checked
                                                                            ? [...assignedIds, inst.id]
                                                                            : assignedIds.filter(id => id !== inst.id);
                                                                        handleAssign(item.id, newIds);
                                                                    }}
                                                                >
                                                                    {inst.name}
                                                                </DropdownMenuCheckboxItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                                                    {savingId === item.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-aerojet-blue inline-block" />
                                                    ) : item.instructors.length > 0 ? (
                                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                            {item.instructors.length} Assigned
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                            Unassigned
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {selectedCohort.curriculum.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">
                                                No courses found in this cohort curriculum.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">Please select an intake and cohort to view courses.</p>
                </div>
            )}
        </div>
    );
}
