import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// GET: List all users (for admin management)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Only Admins and Staff can view the user list
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create a new user (Admin/Staff/Student)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Only Admins can create new users
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();

  try {
    const hashedPassword = await hash(password, 10);
    
    // Create User and potentially Student Profile in one transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'STUDENT', // Default to student if no role is provided
          isActive: true // Admin-created accounts are active by default
        }
      });

      // If it's a student, create their linked profile
      if (newUser.role === 'STUDENT') {
        await tx.student.create({
          data: {
            userId: newUser.id,
            enrollmentStatus: 'APPLICANT' // Start as applicant
          }
        });
      }
      return newUser;
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    // Check for unique constraint violation (email taken)
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH: Update user role OR activation status
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Only Admins can change roles or activate
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, role, isActive, image } = await req.json();

  try {
    const dataToUpdate: any = {};
    if (role) dataToUpdate.role = role;
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (image) dataToUpdate.image = image;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
