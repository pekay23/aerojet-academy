import React from 'react';
import BrowseCoursesClient from './_components/BrowseCoursesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Browse Courses | Student Portal',
};

export default function BrowseCoursesPage() {
    return <BrowseCoursesClient />;
}
