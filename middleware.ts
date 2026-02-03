import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isPortalLive = process.env.NEXT_PUBLIC_PORTAL_LIVE === 'true';
  
  // Check if the "Magic Key" cookie exists in the user's browser
  const hasAccessCookie = req.cookies.has('portal_access');
  
  const { pathname } = req.nextUrl;

  // If portal is LOCKED and user doesn't have the "Magic Key"
  if (!isPortalLive && !hasAccessCookie) {
    if (
      pathname.startsWith('/portal') || 
      pathname.startsWith('/staff') || 
      pathname.startsWith('/register')
    ) {
      // Redirect them away
      return NextResponse.redirect(new URL('/contact', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*', '/staff/:path*', '/register'],
};
