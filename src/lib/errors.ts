import { NextResponse } from 'next/server';

/**
 * Standardized error handler to prevent leaking database schema or internal details to the client.
 */
export function handleApiError(error: any, context?: string) {
  const timestamp = new Date().toISOString();
  
  // Log detailed error server-side with context
  console.error(`[${timestamp}] ERROR ${context ? `in ${context}` : ''}:`, {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack, // Stack trace stays on the server!
  });

  const isProd = process.env.NODE_ENV === 'production';
  
  let message = "An unexpected error occurred. Please contact support.";
  let status = 500;

  // Distinguish between 4xx (Client) and 5xx (Server)
  if (error.name === 'ZodError') {
    message = "The information provided is invalid. Please check your inputs.";
    status = 400;
  } else if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002') {
      message = "A record with this information already exists.";
      status = 409;
    } else if (error.code === 'P2025') {
      message = "The requested record could not be found.";
      status = 404;
    } else {
      // Generic message for other DB errors in prod
      message = "Database operation failed.";
      status = 500;
    }
  } else if (error.status && error.status >= 400 && error.status < 500) {
    message = error.message;
    status = error.status;
  }

  return NextResponse.json({ 
    success: false, 
    error: isProd ? message : error.message, // Production gets the sanitized message
    requestId: isProd ? undefined : timestamp // Helpful for tracking in dev
  }, { status });
}
