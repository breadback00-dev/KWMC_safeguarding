import { NextResponse } from 'next/server';
import { performCheckIn } from '@/lib/services/attendance';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  const result = await performCheckIn(childId, 'qr');

  if (!result.success) {
    const status = result.error === 'Child is already checked in.' ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    status: 'checked_in',
    childId,
    attendanceId: result.data.id,
    sessionId: result.data.session_id,
  });
}
