import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getSessionById } from '@/lib/queries/sessions';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      checked_in_at,
      check_out_time,
      status,
      children ( name, parent_name, parent_phone )
    `)
    .eq('session_id', sessionId)
    .order('checked_in_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type ChildInfo = { name: string; parent_name: string | null; parent_phone: string };
  type AttendanceRow = {
    id: string;
    checked_in_at: string | null;
    check_out_time: string | null;
    status: string;
    children: ChildInfo | ChildInfo[] | null;
  };
  const rows = (data ?? []) as unknown as AttendanceRow[];

  const getChild = (c: AttendanceRow['children']): ChildInfo | null => {
    if (!c) return null;
    return Array.isArray(c) ? (c[0] ?? null) : c;
  };

  const fmt = (ts: string | null) =>
    ts
      ? new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';

  const header = ['Child Name', 'Parent Name', 'Parent Phone', 'Check In', 'Check Out', 'Status'];
  const lines = rows.map(r => {
    const child = getChild(r.children);
    return [
      child?.name ?? '',
      child?.parent_name ?? '',
      child?.parent_phone ?? '',
      fmt(r.checked_in_at),
      fmt(r.check_out_time),
      r.status,
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [header.join(','), ...lines].join('\r\n');
  const filename = `attendance-${session.date}-${session.club_name.replace(/\s+/g, '-')}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
