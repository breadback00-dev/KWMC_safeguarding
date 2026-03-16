'use client';

import { useState, useTransition } from 'react';
import { sendAbsenceAlerts } from '@/lib/actions/absence';

interface Props {
  sessionId: string;
  absentCount: number;
}

export function SendAbsenceAlertsButton({ sessionId, absentCount }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await sendAbsenceAlerts(sessionId);
      if (res.success) setResult(res.data);
    });
  }

  if (result) {
    return (
      <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
        {result.sent > 0
          ? `${result.sent} alert${result.sent !== 1 ? 's' : ''} sent`
          : 'No new alerts sent'}
        {result.skipped > 0 && ` · ${result.skipped} skipped`}
        {result.failed > 0 && ` · ${result.failed} failed`}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || absentCount === 0}
      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white
                 text-sm font-semibold rounded-xl transition-colors"
    >
      {isPending ? 'Sending…' : `Send Absence Alerts (${absentCount})`}
    </button>
  );
}
