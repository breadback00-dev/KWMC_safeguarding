'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/auth-client';

interface DashboardRefreshProps {
  sessionId: string;
}

/**
 * Subscribes to real-time Supabase changes for the current session.
 * Triggers a server re-render immediately on attendance or safeguarding changes.
 * Falls back to 60-second polling when the websocket is not connected.
 */
export function DashboardRefresh({ sessionId }: DashboardRefreshProps) {
  const router = useRouter();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          router.refresh();
          setSecondsAgo(0);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'safeguarding_incidents',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          router.refresh();
          setSecondsAgo(0);
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    const ticker = setInterval(() => setSecondsAgo(s => s + 1), 1000);

    // Fallback polling if websocket drops
    const refresher = setInterval(() => {
      router.refresh();
      setSecondsAgo(0);
    }, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(ticker);
      clearInterval(refresher);
    };
  }, [router, sessionId]);

  const label =
    secondsAgo < 5
      ? 'just now'
      : secondsAgo < 60
      ? `${secondsAgo}s ago`
      : `${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
      <p className="text-xs text-gray-400">
        {connected ? 'Live' : `Updated ${label}`}
      </p>
    </div>
  );
}
