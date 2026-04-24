import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionCookie = (await cookies()).get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    // Auto-calculate shift based on current time (Asia/Kolkata)
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(formatter.format(date));
    
    let shift = 'Night';
    if (hour >= 6 && hour < 14) shift = 'Morning';
    else if (hour >= 14 && hour < 22) shift = 'Evening';

    return NextResponse.json({ 
      success: true, 
      user: {
        id: session.id,
        role: session.role,
        name: session.name
      },
      shift
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
