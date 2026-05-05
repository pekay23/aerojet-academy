import { NextRequest, NextResponse } from 'next/server'
import { prismaBase as prisma } from '@/lib/prisma/db-base'

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true, status: true },
      take: 10
    })
    return NextResponse.json({
      success: true,
      user_count: users.length,
      users: users
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
