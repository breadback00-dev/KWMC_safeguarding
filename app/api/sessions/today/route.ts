import { NextResponse } from 'next/server';

export async function GET() {
    // TODO:
    // 1. Fetch today's session from Supabase
    // 2. Fetch registered children and their attendance status
    // 3. Return combined data

    return NextResponse.json({
        session: null,
        children: []
    });
}
