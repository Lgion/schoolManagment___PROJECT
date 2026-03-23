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
    
    // Si l'utilisateur n'est pas connecté via Clerk, on le laisse naviguer en mode "Sample Data" (Falsy)
    // Au lieu de rejeter ou rediriger, on laisse simplement passer la requête, 
    // et les apis / composants utiliseront MONGODB_sample_URI
    if (!authObj.userId) {
      // Optionnel : on peut set un header x-sample-mode pour être sûr,
      // mais le checks se fera via auth() dans dbConnect.js
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-sample-mode', 'true');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
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