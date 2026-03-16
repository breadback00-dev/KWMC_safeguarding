'use client';

import { useState, useTransition } from 'react';
import { checkInChild } from '@/lib/actions/checkin';

export function CheckInButton({ childId }: { childId: string }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await checkInChild(childId);
      if (result.success) {
        setStatus('success');
      } else {
        setErrorMessage(result.error);
        setStatus('error');
      }
    });
  };

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-700">Checked In</h2>
        <p className="text-gray-500 mt-2 text-sm">Arrival recorded. Parent notified.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">Check-in failed</h2>
        <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
        <button
          onClick={() => setStatus('idle')}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-gray-500 mb-8 text-sm">
        Tap the button below to confirm arrival.
      </p>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-5 rounded-xl text-xl transition-colors"
      >
        {isPending ? 'Checking in…' : 'Confirm Check-In'}
      </button>
    </div>
  );
}
