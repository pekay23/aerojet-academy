import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // --- PORTAL ACCESS LOGIC REMOVED ---
  // The portal is now open to everyone. 
  // Access control is strictly handled by the database/role logic.

  return NextResponse.next();
}

/**
 * Configure which paths the middleware runs on.
 * We exclude API routes (except for auth), static files, and icons for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
