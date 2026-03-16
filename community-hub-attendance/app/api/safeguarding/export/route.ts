import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { INCIDENT_TYPES } from '@/types';
import type { IncidentType } from '@/types';

export async function GET() {
  const { data, error } = await supabase
    .from('safeguarding_incidents')
    .select('*, children(name), sessions(date, club_name)')
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
    children: { name: string } | { name: string }[] | null;
    sessions: { date: string; club_name: string } | { date: string; club_name: string }[] | null;
  }>;

  const getChild = (c: typeof rows[number]['children']) => {
    if (!c) return null;
    return Array.isArray(c) ? (c[0] ?? null) : c;
  };
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
    'Date & Time', 'Child', 'Session', 'Type', 'Notes',
    'Amended Notes', 'Amended By', 'Amended At', 'Logged By',
  ];

  const lines = rows.map(r => {
    const child = getChild(r.children);
    const session = getSession(r.sessions);
    return [
      fmt(r.created_at),
      child?.name ?? '',
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
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="safeguarding-report-${date}.csv"`,
    },
  });
}
