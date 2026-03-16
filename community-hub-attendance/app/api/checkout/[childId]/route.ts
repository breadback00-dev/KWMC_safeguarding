import { NextResponse } from 'next/server';
import { performCheckOut } from '@/lib/services/attendance';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  const result = await performCheckOut(childId, 'qr');

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    status: 'checked_out',
    childId,
    attendanceId: result.data.id,
    sessionId: result.data.session_id,
  });
}
