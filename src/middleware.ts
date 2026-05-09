import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 5. RATE LIMITING (Rule 5) - Simple IP-based limiter
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 60; // 60 requests per minute

  const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - rateData.lastReset > windowMs) {
    rateData.count = 0;
    rateData.lastReset = now;
  }

  rateData.count++;
  rateLimitMap.set(ip, rateData);

  if (rateData.count > maxRequests) {
    return new NextResponse(JSON.stringify({ 
      success: false, 
      error: 'Too many requests. Please try again in a minute.' 
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://malar-hospital-saas-ymm7.vercel.app';

  // 1. RESTRICTED CORS (Rule 4)
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
