import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { createAuditLog } from '@/lib/audit/logger'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const passkey = await prisma.passkey.findUnique({
      where: { id },
    })

    if (!passkey || passkey.userId !== session.user.id) {
      return new NextResponse('Passkey not found', { status: 404 })
    }

    // Check account lockout risk (don't delete last passkey if no password)
    // Actually, users always have passwords in this system, but good to check.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, _count: { select: { passkeys: true } } },
    })

    if (!user?.password && user?._count.passkeys === 1) {
      return new NextResponse(
        'Cannot delete the last passkey on an account without a password',
        { status: 400 }
      )
    }

    await prisma.passkey.delete({
      where: { id },
    })

    await createAuditLog({
      action: 'PASSKEY_DELETED',
      entity: 'users',
      entityId: session.user.id,
      userId: session.user.id,
      description: `Deleted passkey: ${passkey.name || 'Unknown'}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PASSKEY_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name } = body

    if (!name || name.trim() === '') {
      return new NextResponse('Name is required', { status: 400 })
    }

    const passkey = await prisma.passkey.findUnique({
      where: { id },
    })

    if (!passkey || passkey.userId !== session.user.id) {
      return new NextResponse('Passkey not found', { status: 404 })
    }

    const updated = await prisma.passkey.update({
      where: { id },
      data: { name: name.trim() },
    })

    return NextResponse.json({ success: true, passkey: updated })
  } catch (error) {
    console.error('[PASSKEY_UPDATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
