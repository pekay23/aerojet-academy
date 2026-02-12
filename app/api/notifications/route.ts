import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(_req: Request) {
    const { error, session } = await withAuth();
  if (error) return error;

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: (session.user as { id: string }).id }
        });

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { userId: (session.user as { id: string }).id, isRead: false }
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function PATCH(_req: Request) {
    const { error, session } = await withAuth();
  if (error) return error;

    try {
        // Mark all as read
        await prisma.notification.updateMany({
            where: { userId: (session.user as { id: string }).id, isRead: false },
            data: { isRead: true }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
