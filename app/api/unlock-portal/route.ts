import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  // You can change this secret to anything you want
  const ADMIN_SECRET = "Aerojet2026"; 

  if (secret === ADMIN_SECRET) {
    const cookieStore = await cookies();
    
    // Set a cookie that lasts for 7 days
    cookieStore.set('portal_access', 'true', {
      maxAge: 60 * 60 * 24 * 7, 
      path: '/',
      httpOnly: true, // Security: Script cannot read this cookie
      secure: true,
      sameSite: 'lax',
    });

    // Redirect to home after setting cookie
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.json({ error: "Invalid secret key" }, { status: 403 });
}
