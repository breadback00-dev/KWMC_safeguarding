'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createSession } from '@/lib/actions/sessions';
import type { ActionResult, Session } from '@/types';

const initialState: ActionResult<Session> | null = null;

export default function NewSessionPage() {
  const today = new Date().toISOString().split('T')[0];
  const [state, formAction, pending] = useActionState<ActionResult<Session> | null, FormData>(
    createSession,
    initialState
  );

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Sessions</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Session</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure the session details before opening it.</p>
      </div>

      {state && !state.success && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Club / Session name</label>
          <input
            name="club_name"
            type="text"
            required
            defaultValue="After School Club"
            className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={today}
            className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
            <input
              name="start_time"
              type="time"
              required
              defaultValue="15:00"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
            <input
              name="end_time"
              type="time"
              required
              defaultValue="17:30"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
          <input
            name="capacity"
            type="number"
            required
            min={1}
            max={200}
            defaultValue={30}
            className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Maximum number of children for this session.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white
                       font-semibold rounded-xl transition-colors text-sm"
          >
            {pending ? 'Creating…' : 'Create Session'}
          </button>
          <Link
            href="/"
            className="flex items-center justify-center px-5 h-11 bg-gray-100 hover:bg-gray-200
                       text-gray-700 font-semibold rounded-xl transition-colors text-sm"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}
