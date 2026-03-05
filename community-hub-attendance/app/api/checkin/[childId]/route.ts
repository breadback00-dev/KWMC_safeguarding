import { NextResponse } from 'next/server';

export async function POST(request: Request, context: any) {
    // Await the params to resolve Next.js 15 route parameters asynchronously
    const { childId } = await context.params;

    // 1. Mock recording check-in
    console.log(`[DB] Attendance record created: Child ${childId} CHECKED IN.`);

    // 2. Mock sending arrival SMS
    console.log(`[SMS] To Parent of Child ${childId}: "Jack has arrived at Football Club at ${new Date().toLocaleTimeString()}."`);

    // 3. Mock safeguarding log
    console.log(`[LOG] Safeguarding event: CHECK_IN recorded for Child ${childId}.`);

    return NextResponse.json({ status: 'checked_in', childId });
}
