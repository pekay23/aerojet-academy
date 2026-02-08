import React from 'react';
import MyCoursesClient from './_components/MyCoursesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Courses | Student Portal',
};

export default function MyCoursesPage() {
  return <MyCoursesClient />;
}
