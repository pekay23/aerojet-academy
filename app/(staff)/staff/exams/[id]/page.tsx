import React from 'react';
import ExamDetailClient from './_components/ExamDetailClient';
export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExamDetailClient id={id} />;
}
