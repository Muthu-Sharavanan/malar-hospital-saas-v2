import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for rate limiting
// Note: This resets on Vercel cold starts, but provides 
// a strong first layer of defense for a Solopreneur setup.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'; // Fallback for local dev

  // 1. CORS & Origin Protection
  // If the request is from a different origin, and it's not the allowed one, block it.
  if (origin && origin !== allowedOrigin && process.env.NODE_ENV === 'production') {
    return new NextResponse(
      JSON.stringify({ error: 'CORS Forbidden', message: 'Unauthorized origin' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Only apply further security to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Method Restriction
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(request.method)) {
    return new NextResponse(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ip = request.ip || '127.0.0.1';
  const now = Date.now();

  // Configuration for different routes
  const isAuth = pathname.includes('/login') || pathname.includes('/register');
  const limit = isAuth ? 5 : 60;
  const windowMs = isAuth ? 15 * 60 * 1000 : 60 * 1000;
  
  const key = `${ip}:${isAuth ? 'auth' : 'api'}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `You have exceeded the rate limit. Please try again in ${retryAfter} seconds.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  // Increment count
  record.count += 1;
  
  // 3. APPLY SECURITY HEADERS
  const response = NextResponse.next();
  
  // Content Security Policy (Basic restrictive policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; frame-ancestors 'none';"
  );
  
  // Anti-Clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Anti-Sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Force HTTPS (HSTS) - 1 year
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Hide framework info
  response.headers.delete('X-Powered-By');

  return response;
}

// Ensure middleware only runs on API routes for performance
export const config = {
  matcher: '/api/:path*',
};
