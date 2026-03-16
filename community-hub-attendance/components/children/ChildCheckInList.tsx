'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import type { Child } from '@/types';
import { checkInChild, undoCheckIn } from '@/lib/actions/checkin';
import { ChildRow, type RowStatus } from './ChildRow';

const UNDO_WINDOW_MS = 5 * 60 * 1000;

interface ChildCheckInListProps {
  children: Child[];
  initialCheckedInIds: string[];
}

interface RecentCheckIn {
  attendanceId: string;
  checkedInAt: number;
}

export function ChildCheckInList({
  children,
  initialCheckedInIds,
}: ChildCheckInListProps) {
  const [statusMap, setStatusMap] = useState<Map<string, RowStatus>>(() => {
    const m = new Map<string, RowStatus>();
    for (const id of initialCheckedInIds) m.set(id, 'done');
    return m;
  });
  const [errorMap, setErrorMap] = useState<Map<string, string>>(new Map());
  const [recentCheckIns, setRecentCheckIns] = useState<Map<string, RecentCheckIn>>(new Map());
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  // Tick every second to update undo countdowns
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const setStatus = (childId: string, s: RowStatus) =>
    setStatusMap(prev => new Map(prev).set(childId, s));

  const setError = (childId: string, msg: string) =>
    setErrorMap(prev => new Map(prev).set(childId, msg));

  const showToast = (name: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(name);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleCheckIn = (childId: string, childName: string) => {
    const current = statusMap.get(childId);
    if (current === 'done' || current === 'optimistic') return;
    setStatus(childId, 'optimistic');
    startTransition(async () => {
      const result = await checkInChild(childId);
      if (result.success) {
        setStatus(childId, 'done');
        setRecentCheckIns(prev => new Map(prev).set(childId, {
          attendanceId: result.data.id,
          checkedInAt: Date.now(),
        }));
        showToast(childName);
      } else {
        setError(childId, result.error);
        setStatus(childId, 'error');
      }
    });
  };

  const handleUndo = (childId: string, attendanceId: string) => {
    startTransition(async () => {
      const result = await undoCheckIn(attendanceId);
      if (result.success) {
        setStatus(childId, 'pending');
        setRecentCheckIns(prev => {
          const next = new Map(prev);
          next.delete(childId);
          return next;
        });
      }
    });
  };

  const q = query.trim().toLowerCase();

  const remaining = useMemo(
    () =>
      children
        .filter(c => { const s = statusMap.get(c.id); return s !== 'done' && s !== 'optimistic'; })
        .filter(c => !q || c.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [children, statusMap, q]
  );

  const done = useMemo(
    () =>
      children
        .filter(c => { const s = statusMap.get(c.id); return s === 'done' || s === 'optimistic'; })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [children, statusMap]
  );

  const doneCount = done.length;
  const toGoCount = children.length - doneCount;
  const allDone = toGoCount === 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && remaining.length > 0) {
      e.preventDefault();
      handleCheckIn(remaining[0].id, remaining[0].name);
      setQuery('');
    }
  };

  if (children.length === 0) {
    return <p className="text-center text-gray-400 py-12">No active children registered.</p>;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <span className="text-green-600 text-lg">\u2713</span>
          <div>
            <p className="text-green-800 font-semibold text-sm">{toast} checked in</p>
            <p className="text-green-600 text-xs">Parent text sent</p>
          </div>
        </div>
      )}

      <div className={[
        'flex items-center justify-between px-4 py-3 rounded-xl border',
        allDone ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100',
      ].join(' ')}>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-black tabular-nums ${allDone ? 'text-green-600' : 'text-blue-700'}`}>
            {doneCount}
          </span>
          <span className="text-sm text-gray-500 font-medium">checked in</span>
        </div>
        {allDone ? (
          <span className="text-sm font-bold text-green-700">All done!</span>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums text-gray-700">{toGoCount}</span>
            <span className="text-sm text-gray-500 font-medium">to go</span>
          </div>
        )}
      </div>

      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          autoFocus
          autoComplete="off"
          placeholder="Search by name\u2026 Enter to check in first result"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-14 pl-12 pr-12 rounded-xl border border-gray-300 bg-white
                     text-lg placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); searchRef.current?.focus(); }}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center
                       justify-center rounded-full bg-gray-200 hover:bg-gray-300
                       text-gray-600 text-sm font-bold transition-colors"
          >
            \u2715
          </button>
        )}
      </div>

      {remaining.length > 0 && (
        <div role="list" className="space-y-2">
          {remaining.map(child => (
            <ChildRow
              key={child.id}
              name={child.name}
              status={statusMap.get(child.id) ?? 'pending'}
              onAction={() => handleCheckIn(child.id, child.name)}
              onRetry={() => handleCheckIn(child.id, child.name)}
              actionLabel="Check In"
              doneLabel="In \u00b7 Text sent"
              accentColor="blue"
              errorMessage={errorMap.get(child.id)}
            />
          ))}
        </div>
      )}

      {remaining.length === 0 && q && (
        <p className="text-center text-gray-400 text-sm py-4">
          No match for &ldquo;{query}&rdquo;
        </p>
      )}

      {done.length > 0 && (
        <>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">
              Checked In \u00b7 {done.length}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div role="list" className="space-y-1.5">
            {done.map(child => {
              const recent = recentCheckIns.get(child.id);
              const msLeft = recent ? UNDO_WINDOW_MS - (now - recent.checkedInAt) : 0;
              const canUndo = recent && msLeft > 0;
              const secsLeft = canUndo ? Math.ceil(msLeft / 1000) : 0;
              return (
                <div key={child.id} className={canUndo ? '' : 'opacity-50'}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ChildRow
                        name={child.name}
                        status={statusMap.get(child.id) ?? 'done'}
                        onAction={() => {}}
                        onRetry={() => {}}
                        actionLabel="Check In"
                        doneLabel="In \u00b7 Text sent"
                        accentColor="blue"
                      />
                    </div>
                    {canUndo && (
                      <button
                        onClick={() => handleUndo(child.id, recent.attendanceId)}
                        className="shrink-0 px-3 h-11 text-xs font-semibold text-gray-500
                                   hover:text-red-600 hover:bg-red-50 border border-gray-200
                                   hover:border-red-200 rounded-xl transition-colors"
                      >
                        Undo {secsLeft < 60
                          ? `(${secsLeft}s)`
                          : `(${Math.ceil(secsLeft / 60)}m)`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
