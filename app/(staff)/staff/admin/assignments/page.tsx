
import React from 'react';
import { Metadata } from 'next';
import AssignmentClient from './_components/AssignmentClient';

export const metadata: Metadata = {
    title: 'Instructor Assignments | Admin',
    description: 'Assign instructors to courses',
};

export default function AssignmentPage() {
    return <AssignmentClient />;
}
