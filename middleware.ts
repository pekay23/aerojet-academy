import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protected route groups — require authentication
  const protectedPaths = ['/staff', '/portal/dashboard', '/applicant'];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/portal/login', req.url));
  }

  // Role-based guards — students can't access staff pages
  if (pathname.startsWith('/staff') && token?.role === 'STUDENT') {
    return NextResponse.redirect(new URL('/portal/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
