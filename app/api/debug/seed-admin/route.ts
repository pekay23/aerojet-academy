import { NextRequest, NextResponse } from 'next/server'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const email = 'admin@aerojet-academy.com'
    const password = process.env.ADMIN_PASSWORD || 'Admin@2026'
    
    console.log(`[DEBUG_SEED] Ensuring admin user: ${email}`)
    
    const adminPassword = await bcrypt.hash(password, 12)
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: adminPassword,
        status: 'ACTIVE',
        role: 'ADMIN',
        mustChangePassword: false,
      },
      create: {
        email,
        academyEmail: email,
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        status: 'ACTIVE',
        mustChangePassword: false,
        profile: {
          create: {
            firstName: 'Super',
            lastName: 'Admin',
            phone: '+233200000000',
            nationality: 'Ghanaian',
            country: 'Ghana',
            city: 'Accra',
          },
        },
        staffProfile: {
          create: {
            employeeId: 'AD-001',
            department: 'Administration',
            position: 'Super Administrator',
          },
        },
      },
    })
    
    return NextResponse.json({
      success: true,
      message: `Admin user ${user.email} ensured.`,
      password_used: password === 'Admin@2026' ? 'Default (Admin@2026)' : 'From Env',
    })
  } catch (error: any) {
    console.error('[DEBUG_SEED] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
