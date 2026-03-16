'use client';

import { useState, useTransition } from 'react';
import { amendIncident } from '@/lib/actions/safeguarding';
import { INCIDENT_TYPES } from '@/types';
import type { SafeguardingIncidentRow } from '@/types';

interface Props {
  incidents: SafeguardingIncidentRow[];
  sessionId: string;
}

export function IncidentTable({ incidents, sessionId }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const startEdit = (incident: SafeguardingIncidentRow) => {
    setEditingId(incident.id);
    setDraftNotes(incident.amended_notes ?? incident.notes);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftNotes('');
    setError('');
  };

  const saveEdit = (incidentId: string) => {
    setError('');
    startTransition(async () => {
      const result = await amendIncident(incidentId, draftNotes, sessionId);
      if (result.success) {
        setEditingId(null);
      } else {
        setError(result.error);
      }
    });
  };

  if (incidents.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-gray-400">
        No incidents recorded for this session.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left">
            <th className="px-4 py-3 font-semibold text-gray-600">Time</th>
            <th className="px-4 py-3 font-semibold text-gray-600">Child</th>
            <th className="px-4 py-3 font-semibold text-gray-600">Type</th>
            <th className="px-4 py-3 font-semibold text-gray-600">Notes</th>
            <th className="px-4 py-3 font-semibold text-gray-600">Logged by</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {incidents.map(incident => (
            <tr key={incident.id} className="hover:bg-gray-50 transition-colors align-top">
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {new Date(incident.created_at).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                {incident.child_name}
              </td>
              <td className="px-4 py-3">
                <span className={[
                  'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  incident.incident_type === 'safeguarding_concern'
                    ? 'bg-red-100 text-red-700'
                    : incident.incident_type === 'injury'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-amber-100 text-amber-700',
                ].join(' ')}>
                  {INCIDENT_TYPES[incident.incident_type]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700 max-w-xs">
                {editingId === incident.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={draftNotes}
                      onChange={e => setDraftNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(incident.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                                   text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        {isPending ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700
                                   text-xs font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>{incident.amended_notes ?? incident.notes}</p>
                    {incident.amended_notes && (
                      <p className="text-xs text-gray-400 mt-1">
                        Amended by {incident.amended_by} ·{' '}
                        {new Date(incident.amended_at!).toLocaleTimeString('en-GB', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {incident.created_by}
              </td>
              <td className="px-4 py-3">
                {editingId !== incident.id && (
                  <button
                    onClick={() => startEdit(incident)}
                    className="text-xs text-gray-400 hover:text-blue-600 font-medium transition-colors"
                  >
                    Amend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
