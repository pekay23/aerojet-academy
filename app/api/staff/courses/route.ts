import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

// GET: Fetch courses with instructors
export async function GET(req: Request) {
  // ... auth check ...
  const courses = await prisma.course.findMany({
    orderBy: { code: 'asc' },
    include: { instructors: true } // Include instructor details
  });
  // Also fetch list of all potential instructors for the dropdown
  const instructors = await prisma.user.findMany({ where: { role: 'INSTRUCTOR' } });

  return NextResponse.json({ courses, instructors });
}

// POST: Create a new course/module
export async function POST(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { code, title, price, duration, description } = await req.json();

  try {
    const course = await prisma.course.create({
      data: {
        code,
        title,
        price: parseFloat(price),
        duration: duration || 'Exam Only',
        description: description || `Official EASA Part-66 Module Exam for ${title}.`
      }
    });
    return NextResponse.json({ success: true, course });
  } catch (error) {
    return NextResponse.json({ error: 'Creation failed. Code must be unique.' }, { status: 500 });
  }
}

// PATCH: Update course (including instructor assignment)
export async function PATCH(req: Request) {
  // ... auth check ...
  const { id, materialLink, price, title, instructorIds } = await req.json();

  try {
    await prisma.course.update({
      where: { id },
      data: {
        materialLink,
        price: price ? parseFloat(price) : undefined,
        title,
        // Update instructors relationship
        instructors: instructorIds ? {
          set: instructorIds.map((uid: string) => ({ id: uid }))
        } : undefined
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE: Remove a course
export async function DELETE(req: Request) {
  const { error } = await withAuth(['ADMIN']);
  if (error) return error;

  const { id } = await req.json();

  try {
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed. May have dependent data.' }, { status: 500 });
  }
}
