import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-helpers';

// GET: List users (with filtering)
export async function GET(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');
  const roleFilter = searchParams.get('role');

  const where: Prisma.UserWhereInput = {
    isDeleted: view === 'trash' ? true : false,
  };

  // Apply role filtering based on the query parameter
  if (roleFilter === 'students') {
    where.role = 'STUDENT';
  } else if (roleFilter === 'staff') {
    where.role = { in: ['ADMIN', 'STAFF', 'INSTRUCTOR'] };
  }

  try {
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        studentProfile: {
          select: { id: true, studentId: true, cohort: true, enrollmentStatus: true }
        }
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { name, email, password, role, image } = await req.json();

  try {
    const hashedPassword = await hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'STUDENT',
          isActive: true,
          image: image || null,
          isDeleted: false
        }
      });

      if (newUser.role === 'STUDENT') {
        await tx.student.create({
          data: {
            userId: newUser.id,
            enrollmentStatus: 'APPLICANT'
          }
        });
      }
      return newUser;
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}

// PATCH: Update user (Edit Name, Role, Image, Active Status)
export async function PATCH(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { userId, name, role, isActive, image, isDeleted } = await req.json();

  try {
    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (role) dataToUpdate.role = role;
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (image) dataToUpdate.image = image;

    if (typeof isDeleted === 'boolean') {
      dataToUpdate.isDeleted = isDeleted;
      dataToUpdate.deletedAt = isDeleted ? new Date() : null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE: Soft Delete (Archive) OR Hard Delete
export async function DELETE(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const permanent = searchParams.get('permanent') === 'true';

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    if (permanent) {
      await prisma.user.delete({
        where: { id }
      });
    } else {
      await prisma.user.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: 'Delete failed. User may have dependent records.' }, { status: 500 });
  }
}
