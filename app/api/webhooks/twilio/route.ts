import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // TODO:
    // 1. Parse inbound SMS webhook from Twilio
    // 2. Handle parent replies (e.g. LATE, NOT COMING)
    // 3. Log reply
    // 4. Update safeguarding log (PARENT_REPLY)

    return NextResponse.json({ success: true });
}
