import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Check the environment variable
  const isPortalLive = process.env.NEXT_PUBLIC_PORTAL_LIVE === 'true';
  const { pathname } = req.nextUrl;

  // If portal is NOT live, block specific routes
  if (!isPortalLive) {
    if (
      pathname.startsWith('/portal') || 
      pathname.startsWith('/staff') || 
      pathname.startsWith('/register') // <--- ADDED THIS
    ) {
      // Redirect to Contact page instead of Home
      return NextResponse.redirect(new URL('/contact', req.url));
    }
  }

  return NextResponse.next();
}

// Update matcher to catch the register route
export const config = {
  matcher: ['/portal/:path*', '/staff/:path*', '/register'],
};
