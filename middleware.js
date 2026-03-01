import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);

const isAdminRoute = createRouteMatcher(['/administration(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (process.env.NEXT_PUBLIC_MODE === 'test') {
    let mockRole = request.cookies.get('mock_role')?.value;
    if (!mockRole) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer mock-token-')) {
        mockRole = authHeader.replace('Bearer mock-token-', '');
      }
    }
    if (mockRole) {
      if (isAdminRoute(request) && mockRole !== 'admin') {
        const url = new URL('/', request.url);
        return NextResponse.redirect(url);
      }
      return;
    }
  }

  if (!isPublicRoute(request)) {
    const authObj = await auth();
    if (!authObj.userId && request.nextUrl.pathname.startsWith('/api')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (!authObj.userId) {
      // Manual redirect allows overriding Clerk's protect() which can throw 404s
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }

  // Prevent Teachers (non-admins) from accessing Admin dashboard routes
  if (isAdminRoute(request)) {
    const { sessionClaims } = await auth();
    const userRole = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
    const userEmail = sessionClaims?.email || sessionClaims?.primary_email_address;
    const adminEmails = (process.env.NEXT_PUBLIC_EMAIL_ADMIN || '').split(' ');

    // Explicit email check to bypass stale metadata in session token
    if (userRole !== 'admin' && !(userEmail && adminEmails.includes(userEmail))) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};