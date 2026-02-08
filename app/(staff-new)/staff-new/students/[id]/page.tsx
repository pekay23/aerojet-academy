import React from 'react';
import StudentProfileClient from './_components/StudentProfileClient';

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentProfileClient id={id} />;
}
