import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://malar-hospital-saas-ymm7.vercel.app';

  // 1. RESTRICTED CORS (Rule 4)
  // If an origin is present, check if it matches our whitelist
  if (origin && origin !== allowedOrigin) {
    return new NextResponse(null, {
      status: 403,
      statusText: 'Forbidden: Unauthorized Origin',
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // 2. SECURITY HEADERS (Rule 6)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.neon.tech;"
  );

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
