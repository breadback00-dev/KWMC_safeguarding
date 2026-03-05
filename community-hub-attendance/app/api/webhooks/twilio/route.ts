import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { message, from, childId } = await request.json();

        // 1. Mock storing the reply
        console.log(`[DB] Parent reply stored: "${message}" from ${from}`);

        // 2. Mock creating safeguarding log entry
        console.log(`[LOG] Safeguarding event: PARENT_REPLY recorded for Child ${childId}. Text: "${message}"`);

        // 3. Mock updating dashboard status
        console.log(`[STAFF ALERT] Parent of child ${childId} replied: ${message}`);

        return NextResponse.json({ status: 'reply_logged' });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to process webhook' }, { status: 400 });
    }
}
