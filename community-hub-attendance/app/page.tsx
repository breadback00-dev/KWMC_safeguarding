import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NavBar } from '@/components/layout/NavBar';
import { getAllSessions } from '@/lib/queries/sessions';
import { getAuthUser } from '@/lib/supabase/auth-server';

export const metadata = { title: 'Community Hub' };

export default async function HomePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const sessions = await getAllSessions();
  const today = new Date().toISOString().split('T')[0];
  const todaySessions     = sessions.filter(s => s.date === today);
  const upcomingSessions  = sessions.filter(s => s.date > today).reverse(); // asc
  const pastSessions      = sessions.filter(s => s.date < today);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userEmail={user.email ?? ''} />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Select a session to manage attendance and safeguarding.</p>
          </div>
          <Link
            href="/sessions/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            + New Session
          </Link>
        </div>

        {/* ── Today ────────────────────────────────────────────────────────── */}
        {todaySessions.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today</p>
            <div className="space-y-3">
              {todaySessions.map(session => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-blue-200 px-5 py-4 hover:border-blue-400 transition-colors shadow-sm group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{session.club_name}</span>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Today</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)} · {session.capacity} capacity
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-black tabular-nums text-blue-600 leading-none">{session.present_count}</p>
                      <p className="text-xs text-gray-400 mt-0.5">present now</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-blue-500 text-xl transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-6 flex flex-col items-center gap-4 text-center">
            <div>
              <p className="font-semibold text-gray-800">No session scheduled for today.</p>
              <p className="text-sm text-gray-500 mt-0.5">Create a session to begin checking children in.</p>
            </div>
            <Link
              href="/sessions/new"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Create Today&apos;s Session
            </Link>
          </div>
        )}

        {/* ── Upcoming ─────────────────────────────────────────────────────── */}
        {upcomingSessions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {upcomingSessions.map(session => (
                  <li key={session.id}>
                    <Link
                      href={`/sessions/${session.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-gray-800">{session.club_name}</span>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(session.date + 'T00:00:00').toLocaleDateString('en-GB', {
                            weekday: 'long', day: 'numeric', month: 'long',
                          })}
                          {' · '}
                          {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400">{session.capacity} capacity</span>
                        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Past sessions ────────────────────────────────────────────────── */}
        {pastSessions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Past Sessions</p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {pastSessions.map(session => (
                  <li key={session.id}>
                    <Link
                      href={`/sessions/${session.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-gray-800">{session.club_name}</span>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(session.date + 'T00:00:00').toLocaleDateString('en-GB', {
                            weekday: 'long', day: 'numeric', month: 'long',
                          })}
                          {' · '}
                          {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums text-gray-600">
                            {session.present_count}
                            <span className="font-normal text-gray-400"> / {session.capacity}</span>
                          </p>
                          <p className="text-xs text-gray-400">attended</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">No sessions yet. Create your first session to get started.</p>
          </div>
        )}

      </main>
    </div>
  );
}
