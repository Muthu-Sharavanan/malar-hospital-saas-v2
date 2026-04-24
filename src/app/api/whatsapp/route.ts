import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, message, templateId } = body;

    // Simulate Network Latency for realism
    await new Promise(resolve => setTimeout(resolve, 800));

    // In a production environment, this is where we would call Twilio or Meta WhatsApp API
    // e.g. twilioClient.messages.create({ from: 'whatsapp:+14155238886', body: message, to: `whatsapp:+91${phone}` })

    console.log(`[WHATSAPP MOCK API] Successfully dispatched template ${templateId || 'default'} to +91${phone}`);
    console.log(`[WHATSAPP MOCK API] Payload Length: ${message?.length || 0} characters`);

    return NextResponse.json({ 
      success: true, 
      status: 'delivered',
      referenceId: `WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      deliveredTo: phone
    });

  } catch (error: any) {
    console.error("WhatsApp Integration Error:", error);
    return NextResponse.json({ success: false, error: "Gateway Timeout or Auth Failure" }, { status: 500 });
  }
}
