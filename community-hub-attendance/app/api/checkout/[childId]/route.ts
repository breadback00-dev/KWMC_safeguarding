import { NextResponse } from 'next/server';

export async function POST(request: Request, context: any) {
    // Await the params
    const { childId } = await context.params;

    // 1. Mock updating check-out time
    console.log(`[DB] Attendance record updated: Child ${childId} CHECKED OUT.`);

    // 2. Mock sending departure SMS
    console.log(`[SMS] To Parent of Child ${childId}: "Jack has left Football Club at ${new Date().toLocaleTimeString()}."`);

    // 3. Mock log safeguarding event
    console.log(`[LOG] Safeguarding event: CHECK_OUT recorded for Child ${childId}.`);

    return NextResponse.json({ status: 'checked_out', childId });
}
