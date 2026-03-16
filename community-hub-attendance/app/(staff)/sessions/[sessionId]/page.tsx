import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSessionById } from '@/lib/queries/sessions';
import { getPresentChildren, getCollectedCount } from '@/lib/queries/attendance';
import { getSessionIncidents, getSessionIncidentRows, getChildrenWithPriorConcerns } from '@/lib/queries/safeguarding';
import { getSmsSummaryToday } from '@/lib/queries/sms';
import { getNotArrivedChildren, getActiveChildren } from '@/lib/queries/children';
import { ChildCheckInList } from '@/components/children/ChildCheckInList';
import { ChildCheckOutList } from '@/components/children/ChildCheckOutList';
import { LogIncidentForm } from '@/components/safeguarding/LogIncidentForm';
import { IncidentTable } from '@/components/safeguarding/IncidentTable';
import { DashboardRefresh } from '@/components/dashboard/DashboardRefresh';
import { SendAbsenceAlertsButton } from '@/components/attendance/SendAbsenceAlertsButton';
import { INCIDENT_TYPES } from '@/types';

export const metadata = { title: 'Session — Community Hub' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(t: string) { return t.slice(0, 5); }

function timeRemaining(endTime: string): { label: string; urgent: boolean; overrun: boolean } {
  const now = new Date();
  const [h, m] = endTime.split(':').map(Number);
  const end = new Date(now);
  end.setHours(h, m, 0, 0);
  const diffMin = Math.round((end.getTime() - now.getTime()) / 60_000);
  if (diffMin < 0)  return { label: `${Math.abs(diffMin)}m overrun`, urgent: true, overrun: true };
  if (diffMin <= 30) return { label: `${diffMin}m remaining`, urgent: true, overrun: false };
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return { label: hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`, urgent: false, overrun: false };
}

const INCIDENT_COLORS: Record<string, string> = {
  safeguarding_concern: 'bg-red-100 text-red-700 border-red-200',
  injury:               'bg-orange-100 text-orange-700 border-orange-200',
  behaviour:            'bg-amber-100 text-amber-700 border-amber-200',
  late_pickup:          'bg-gray-100 text-gray-600 border-gray-200',
  early_collection:     'bg-gray-100 text-gray-600 border-gray-200',
  other:                'bg-gray-100 text-gray-600 border-gray-200',
};

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'checkin' | 'checkout' | 'safeguarding';

const ALL_TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'checkin',      label: 'Check In' },
  { id: 'checkout',     label: 'Check Out' },
  { id: 'safeguarding', label: 'Safeguarding' },
];

function TabNav({ sessionId, active, isToday }: { sessionId: string; active: Tab; isToday: boolean }) {
  const tabs = isToday ? ALL_TABS : ALL_TABS.filter(t => t.id === 'overview' || t.id === 'safeguarding');
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={`/sessions/${sessionId}${tab.id === 'overview' ? '' : `?tab=${tab.id}`}`}
          className={[
            'flex-1 text-center py-2 px-3 rounded-lg text-sm font-semibold transition-colors',
            active === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SessionHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { sessionId } = await params;
  const { tab: tabParam } = await searchParams;

  const session = await getSessionById(sessionId);
  if (!session) notFound();

  const today = new Date().toISOString().split('T')[0];
  const isToday = session.date === today;

  // Normalise tab; non-today sessions can only view overview/safeguarding
  let tab: Tab = (tabParam as Tab) ?? 'overview';
  if (!isToday && tab !== 'safeguarding') tab = 'overview';

  // ── Shared data (always needed) ──
  const presentChildren = await getPresentChildren(session.id);
  const presentCount    = presentChildren.length;
  const capacity        = session.capacity;
  const spacesLeft      = Math.max(0, capacity - presentCount);
  const timeInfo        = isToday ? timeRemaining(session.end_time) : null;

  // ── Tab-specific data ──
  let collectedCount = 0;
  let notArrived: Awaited<ReturnType<typeof getNotArrivedChildren>> = [];
  let incidentsMap = new Map<string, any[]>();
  let priorConcerns = new Set<string>();
  let smsSummary = { sent: 0, failed: 0 };
  let allChildren: Awaited<ReturnType<typeof getActiveChildren>> = [];
  let sessionIncidentRows: Awaited<ReturnType<typeof getSessionIncidentRows>> = [];

  if (tab === 'overview') {
    [collectedCount, notArrived, incidentsMap, smsSummary] = await Promise.all([
      getCollectedCount(session.id),
      getNotArrivedChildren(session.id),
      getSessionIncidents(session.id),
      getSmsSummaryToday(),
    ]);
    const presentIds = presentChildren.map(c => c.id);
    priorConcerns = await getChildrenWithPriorConcerns(presentIds);
  } else if (tab === 'checkin') {
    allChildren = await getActiveChildren();
  } else if (tab === 'safeguarding') {
    [allChildren, sessionIncidentRows] = await Promise.all([
      getActiveChildren(),
      getSessionIncidentRows(session.id),
    ]);
  }

  // Derived for overview
  const todayIncidents = Array.from(incidentsMap.values()).flat();
  const hasSafeguardingConcern = todayIncidents.some(i => i.incident_type === 'safeguarding_concern');
  const childNames = new Map(presentChildren.map(c => [c.id, c.name]));
  const incidentSummary = todayIncidents.reduce<Record<string, Set<string>>>((acc, inc) => {
    if (!acc[inc.incident_type]) acc[inc.incident_type] = new Set();
    acc[inc.incident_type].add(inc.child_id);
    return acc;
  }, {});
  const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  const sessionDateLabel = isToday
    ? 'Today'
    : new Date(session.date + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });

  return (
    <div className="space-y-5">

      {/* ── Session header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Sessions</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{session.club_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sessionDateLabel} · {fmt(session.start_time)}–{fmt(session.end_time)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/sessions/${session.id}/export`}
            download
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800
                       border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            Export CSV
          </a>
          {isToday && <DashboardRefresh sessionId={session.id} />}
        </div>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      <TabNav sessionId={session.id} active={tab} isToday={isToday} />

      {/* ═══════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-5">

          {/* Safeguarding concern banner */}
          {hasSafeguardingConcern && (
            <Link href={`/sessions/${session.id}?tab=safeguarding`} className="block">
              <div className="flex items-start gap-3 px-5 py-4 bg-red-600 text-white rounded-xl shadow-lg">
                <span className="text-2xl mt-0.5">⚠️</span>
                <div>
                  <p className="font-bold text-base">Active Safeguarding Concern</p>
                  <p className="text-red-100 text-sm mt-0.5">
                    A safeguarding concern has been logged this session. Review required — tap to view.
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Session overrun / ending soon banner */}
          {isToday && timeInfo && timeInfo.urgent && presentCount > 0 && (
            <div className={[
              'flex items-start gap-3 px-5 py-4 rounded-xl border',
              timeInfo.overrun
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-amber-50 border-amber-300 text-amber-800',
            ].join(' ')}>
              <span className="text-xl mt-0.5">{timeInfo.overrun ? '🔴' : '⏰'}</span>
              <div>
                <p className="font-bold text-sm">
                  {timeInfo.overrun ? 'Session overrun' : 'Session ending soon'} — {timeInfo.label}
                </p>
                <p className="text-sm mt-0.5">
                  {presentCount} {presentCount === 1 ? 'child is' : 'children are'} still in the building
                </p>
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-black tabular-nums text-blue-600">{presentCount}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Currently Present</p>
              <p className="text-xs text-gray-400 mt-0.5">of {capacity} capacity</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className={`text-2xl font-black tabular-nums ${collectedCount > 0 ? 'text-green-600' : 'text-gray-700'}`}>{collectedCount}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Collected Today</p>
              <p className="text-xs text-gray-400 mt-0.5">checked out</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className={`text-2xl font-black tabular-nums ${spacesLeft === 0 ? 'text-red-500' : spacesLeft <= 5 ? 'text-amber-600' : 'text-gray-700'}`}>{spacesLeft}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Spaces Left</p>
              <p className="text-xs text-gray-400 mt-0.5">{spacesLeft === 0 ? 'Session full' : 'available'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className={`text-2xl font-black tabular-nums ${timeInfo?.urgent ? (timeInfo.overrun ? 'text-red-500' : 'text-amber-600') : 'text-gray-700'}`}>
                {fmt(session.end_time)}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Session Ends</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeInfo?.label ?? (isToday ? 'today' : sessionDateLabel)}</p>
            </div>
          </div>

          {/* Not yet arrived */}
          {notArrived.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-5 py-3 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">⚠️</span>
                  <h3 className="font-semibold text-amber-800 text-sm">
                    Not Yet Arrived — {notArrived.length} registered {notArrived.length === 1 ? 'child' : 'children'}
                  </h3>
                </div>
                {isToday && (
                  <SendAbsenceAlertsButton
                    sessionId={session.id}
                    absentCount={notArrived.length}
                  />
                )}
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-2">
                {notArrived.map(child => (
                  <span key={child.id} className="text-sm bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full font-medium">
                    {child.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prior concerns among present children */}
          {priorConcerns.size > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-orange-50 border-b border-orange-200">
                <span className="text-orange-600">📂</span>
                <h3 className="font-semibold text-orange-800 text-sm">
                  Prior Concerns on Record — {priorConcerns.size} {priorConcerns.size === 1 ? 'child' : 'children'} present today
                </h3>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-2">
                {presentChildren
                  .filter(c => priorConcerns.has(c.id))
                  .map(c => (
                    <span key={c.id} className="text-sm bg-orange-50 border border-orange-200 text-orange-800 px-3 py-1 rounded-full font-medium">
                      {c.name}
                    </span>
                  ))}
              </div>
              <p className="px-5 pb-3 text-xs text-orange-600">
                These children have safeguarding incidents recorded in previous sessions.
              </p>
            </div>
          )}

          {/* Occupancy bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{session.club_name}</h3>
              <span className="text-sm text-gray-500">{fmt(session.start_time)} – {fmt(session.end_time)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all',
                    spacesLeft === 0 ? 'bg-red-500' : spacesLeft <= 5 ? 'bg-amber-500' : 'bg-blue-500',
                  ].join(' ')}
                  style={{ width: `${Math.min(Math.round((presentCount / capacity) * 100), 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 shrink-0 tabular-nums">
                {presentCount} / {capacity}
              </span>
            </div>
          </div>

          {/* Incident summary */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Safeguarding Log — This Session</h3>
              <Link href={`/sessions/${session.id}?tab=safeguarding`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all →
              </Link>
            </div>
            <div className="p-5">
              {todayIncidents.length === 0 ? (
                <div className="flex items-center gap-2 text-green-700">
                  <span className="text-green-500">✓</span>
                  <p className="text-sm font-medium">No incidents logged this session</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(incidentSummary).map(([type, childIdSet]) => {
                    const names = Array.from(childIdSet).map(id => childNames.get(id) ?? 'Unknown');
                    const label = INCIDENT_TYPES[type as keyof typeof INCIDENT_TYPES] ?? type;
                    const colorClass = INCIDENT_COLORS[type] ?? 'bg-gray-100 text-gray-600 border-gray-200';
                    return (
                      <div key={type} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${colorClass}`}>
                        <span className="text-xs font-bold uppercase tracking-wide shrink-0">{label}</span>
                        <span className="text-xs">·</span>
                        <span className="text-xs">{names.join(', ')}</span>
                        <span className="ml-auto text-xs font-bold">{childIdSet.size}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SMS panel */}
          {(twilioConfigured || smsSummary.sent > 0 || smsSummary.failed > 0) ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">SMS Notifications Today</h3>
              <div className="flex gap-8">
                <div>
                  <p className="text-2xl font-black text-green-600">{smsSummary.sent}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-red-500">{smsSummary.failed}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-400">{smsSummary.sent + smsSummary.failed}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total</p>
                </div>
              </div>
              {smsSummary.failed > 0 && (
                <p className="text-xs text-red-600 mt-3 font-medium">
                  ⚠️ {smsSummary.failed} message{smsSummary.failed > 1 ? 's' : ''} failed to send — check Twilio logs.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">SMS notifications are disabled</p>
              <span className="text-xs text-gray-400">Add Twilio credentials to enable</span>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/sessions/${session.id}?tab=checkin`}
              className="flex items-center justify-center h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Check In
            </Link>
            <Link
              href={`/sessions/${session.id}?tab=safeguarding`}
              className="flex items-center justify-center h-14 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Log Incident
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CHECK IN TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'checkin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              Check In
              <span className="ml-2 text-sm font-normal text-gray-400">({allChildren.length} registered)</span>
            </h2>
            <span className="text-sm bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full font-medium">
              {presentCount} present
            </span>
          </div>
          <ChildCheckInList
            children={allChildren}
            initialCheckedInIds={presentChildren.map(c => c.id)}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CHECK OUT TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'checkout' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              Check Out
              <span className="ml-2 text-sm font-normal text-gray-400">({presentCount} in building)</span>
            </h2>
          </div>
          <ChildCheckOutList children={presentChildren} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SAFEGUARDING TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'safeguarding' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Safeguarding Log</h2>
            <p className="text-sm text-gray-500">{sessionDateLabel}</p>
          </div>

          <LogIncidentForm children={allChildren} />

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <IncidentTable incidents={sessionIncidentRows} sessionId={session.id} />
          </div>
        </div>
      )}

    </div>
  );
}
