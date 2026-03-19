import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params
    const { notes } = await request.json()

    // Find and update the student profile
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
      },
    })

    if (!student || !student.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Update admin notes
    await prisma.studentProfile.update({
      where: { userId: studentId },
      data: {
        adminNotes: notes,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save admin notes:', error)
    return NextResponse.json(
      { error: 'Failed to save admin notes' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params

    // Find the student profile
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
      },
    })

    if (!student || !student.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    return NextResponse.json({ notes: student.studentProfile.adminNotes || '' })
  } catch (error) {
    console.error('Failed to fetch admin notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin notes' },
      { status: 500 }
    )
  }
}
