import type { Session } from '@/types';

function fmt12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')}${period}`;
}

interface SessionBannerProps {
  session: Session | null;
  presentCount?: number;
}

export function SessionBanner({ session, presentCount }: SessionBannerProps) {
  if (!session) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
        <p className="text-yellow-800 font-semibold">No session scheduled for today.</p>
        <p className="text-yellow-600 text-sm mt-1">
          Contact an administrator to create a session.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-600 text-white rounded-xl p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-0.5">
          Active Session
        </p>
        <h2 className="text-xl font-bold leading-tight">{session.club_name}</h2>
        <p className="text-blue-200 text-sm mt-0.5">
          {fmt12h(session.start_time)} &ndash; {fmt12h(session.end_time)}
        </p>
      </div>
      {presentCount !== undefined && (
        <div className="text-right shrink-0">
          <p className="text-5xl font-black leading-none">{presentCount}</p>
          <p className="text-blue-200 text-xs mt-1">/ {session.capacity} present</p>
        </div>
      )}
    </div>
  );
}
