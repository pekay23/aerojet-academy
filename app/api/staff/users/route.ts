import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// GET: List users (Supports filtering for 'deleted' vs 'active')
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Security: Only Admins/Staff
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Check query params for "?view=trash"
  const { searchParams } = new URL(req.url);
  const viewTrash = searchParams.get('view') === 'trash';

  try {
    const users = await prisma.user.findMany({
      where: {
        isDeleted: viewTrash ? true : false, // Show only deleted OR only active
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

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
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, name, role, isActive, image, isDeleted } = await req.json();

  try {
    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (role) dataToUpdate.role = role;
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (image) dataToUpdate.image = image;
    
    // Allow restoring a deleted user via PATCH
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

// DELETE: Soft Delete (Archive)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    // Perform Soft Delete
    await prisma.user.update({
      where: { id },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false // Also deactivate login access
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
