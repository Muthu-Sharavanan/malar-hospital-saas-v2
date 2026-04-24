import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';


export const dynamic = 'force-dynamic';

export async function POST() {
  (await cookies()).delete('session');
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = (await cookies()).get('session');
  if (!session) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({ success: true, user: JSON.parse(session.value) });
}
