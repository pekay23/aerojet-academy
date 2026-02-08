import React from 'react';
import CourseViewerClient from './_components/CourseViewerClient';

export default async function CoursePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CourseViewerClient code={code} />;
}
