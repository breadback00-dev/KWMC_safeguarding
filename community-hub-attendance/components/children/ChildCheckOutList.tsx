'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import type { PresentChild } from '@/types';
import { checkOutChild } from '@/lib/actions/checkout';
import { ChildRow, type RowStatus } from './ChildRow';

interface ChildCheckOutListProps {
  children: PresentChild[];
}

export function ChildCheckOutList({ children }: ChildCheckOutListProps) {
  const [statusMap, setStatusMap] = useState<Map<string, RowStatus>>(new Map());
  const [errorMap, setErrorMap] = useState<Map<string, string>>(new Map());
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const setStatus = (childId: string, s: RowStatus) =>
    setStatusMap(prev => new Map(prev).set(childId, s));

  const setError = (childId: string, msg: string) =>
    setErrorMap(prev => new Map(prev).set(childId, msg));

  const showToast = (name: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(name);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleCheckOut = (childId: string, childName: string) => {
    const current = statusMap.get(childId);
    if (current === 'done' || current === 'optimistic') return;
    setStatus(childId, 'optimistic');
    startTransition(async () => {
      const result = await checkOutChild(childId);
      if (result.success) {
        setStatus(childId, 'done');
        showToast(childName);
      } else {
        setError(childId, result.error);
        setStatus(childId, 'error');
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
    () => children.filter(c => { const s = statusMap.get(c.id); return s === 'done' || s === 'optimistic'; }),
    [children, statusMap]
  );

  const doneCount = done.length;
  const toGoCount = children.length - doneCount;
  const buildingClear = toGoCount === 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && remaining.length > 0) {
      e.preventDefault();
      handleCheckOut(remaining[0].id, remaining[0].name);
      setQuery('');
    }
  };

  if (children.length === 0) {
    return <p className="text-center text-gray-400 py-12">No children currently present.</p>;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="text-orange-600 text-lg">\u2713</span>
          <div>
            <p className="text-orange-800 font-semibold text-sm">{toast} collected</p>
            <p className="text-orange-600 text-xs">Departure text sent</p>
          </div>
        </div>
      )}

      <div className={[
        'flex items-center justify-between px-4 py-3 rounded-xl border',
        buildingClear ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-100',
      ].join(' ')}>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-black tabular-nums ${buildingClear ? 'text-green-600' : 'text-orange-700'}`}>
            {doneCount}
          </span>
          <span className="text-sm text-gray-500 font-medium">checked out</span>
        </div>
        {buildingClear ? (
          <span className="text-sm font-bold text-green-700">Building clear!</span>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums text-gray-700">{toGoCount}</span>
            <span className="text-sm text-gray-500 font-medium">still here</span>
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
          placeholder="Search by name\u2026 Enter to check out first result"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-14 pl-12 pr-12 rounded-xl border border-gray-300 bg-white
                     text-lg placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              onAction={() => handleCheckOut(child.id, child.name)}
              onRetry={() => handleCheckOut(child.id, child.name)}
              actionLabel="Check Out"
              doneLabel="Out \u00b7 Text sent"
              accentColor="orange"
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
              Checked Out \u00b7 {done.length}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div role="list" className="space-y-1.5 opacity-50">
            {done.map(child => (
              <ChildRow
                key={child.id}
                name={child.name}
                status={statusMap.get(child.id) ?? 'done'}
                onAction={() => {}}
                onRetry={() => {}}
                actionLabel="Check Out"
                doneLabel="Out \u00b7 Text sent"
                accentColor="orange"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
