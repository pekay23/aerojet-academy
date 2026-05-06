import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')

  if (name) {
    const template = await prismaUnfiltered.emailTemplate.findUnique({
      where: { name },
    })
    return NextResponse.json(template)
  }

  const templates = await prismaUnfiltered.emailTemplate.findMany({
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const data = await req.json()
    const { name, subject, body, description } = data

    if (!name || !subject || !body) {
      return new NextResponse('Name, subject, and body are required', { status: 400 })
    }

    const template = await prismaUnfiltered.emailTemplate.upsert({
      where: { name },
      update: {
        subject,
        body,
        description,
        updatedBy: session.user.id,
      },
      create: {
        name,
        subject,
        body,
        description,
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('[EmailTemplates] POST Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')

  if (!name) {
    return new NextResponse('Name is required', { status: 400 })
  }

  try {
    await prismaUnfiltered.emailTemplate.delete({
      where: { name },
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[EmailTemplates] DELETE Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
