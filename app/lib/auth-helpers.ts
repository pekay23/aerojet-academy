import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

type Role = 'ADMIN' | 'STAFF' | 'INSTRUCTOR' | 'STUDENT';

type AuthSuccess = { error: null; session: Session };
type AuthFailure = { error: NextResponse; session: null };

export async function withAuth(allowedRoles?: Role[]): Promise<AuthSuccess | AuthFailure> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
    }
    const userRole = (session.user as any).role as Role;
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
    }
    return { error: null, session };
}

