import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getChildById } from '@/lib/queries/children';
import { INCIDENT_TYPES } from '@/types';
import type { IncidentType } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const child = await getChildById(childId);
  if (!child) {
    return NextResponse.json({ error: 'Child not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('safeguarding_incidents')
    .select('*, sessions(date, club_name)')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    incident_type: IncidentType;
    notes: string;
    amended_notes: string | null;
    amended_by: string | null;
    amended_at: string | null;
    created_by: string;
    sessions: { date: string; club_name: string } | { date: string; club_name: string }[] | null;
  }>;

  const getSession = (s: typeof rows[number]['sessions']) => {
    if (!s) return null;
    return Array.isArray(s) ? (s[0] ?? null) : s;
  };

  const fmt = (ts: string | null) =>
    ts
      ? new Date(ts).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : '';

  const header = [
    'Date & Time', 'Session', 'Type', 'Notes',
    'Amended Notes', 'Amended By', 'Amended At', 'Logged By',
  ];

  const lines = rows.map(r => {
    const session = getSession(r.sessions);
    return [
      fmt(r.created_at),
      session ? `${session.date} ${session.club_name}` : '',
      INCIDENT_TYPES[r.incident_type] ?? r.incident_type,
      r.notes,
      r.amended_notes ?? '',
      r.amended_by ?? '',
      fmt(r.amended_at),
      r.created_by,
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [header.join(','), ...lines].join('\r\n');
  const safeName = child.name.replace(/\s+/g, '-');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="safeguarding-${safeName}.csv"`,
    },
  });
}
