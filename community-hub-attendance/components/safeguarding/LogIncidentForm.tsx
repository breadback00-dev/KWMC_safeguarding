'use client';

import { useState, useTransition } from 'react';
import { recordIncident } from '@/lib/actions/safeguarding';
import { INCIDENT_TYPES } from '@/types';
import type { Child, IncidentType } from '@/types';

const INCIDENT_KEYS = Object.keys(INCIDENT_TYPES) as IncidentType[];

export function LogIncidentForm({ children }: { children: Child[] }) {
  const [open, setOpen] = useState(false);
  const [childId, setChildId] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('other');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [, startTransition] = useTransition();

  const reset = () => {
    setChildId('');
    setIncidentType('other');
    setNotes('');
    setError('');
  };

  const handleSubmit = () => {
    if (!childId) { setError('Please select a child.'); return; }
    if (!notes.trim()) { setError('Please add a note.'); return; }
    setError('');
    setSuccess('');

    startTransition(async () => {
      const result = await recordIncident(childId, incidentType, notes);
      if (result.success) {
        const child = children.find(c => c.id === childId);
        setSuccess(`Incident logged for ${child?.name ?? 'child'}.`);
        reset();
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div>
      {/* Success toast */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium flex justify-between items-center">
          {success}
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700 font-bold">✕</button>
        </div>
      )}

      {/* Toggle button */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          + Log New Incident
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-amber-800 uppercase tracking-wide">Log Incident</p>
            <button onClick={() => { setOpen(false); reset(); }} className="text-amber-600 hover:text-amber-800 text-lg leading-none">✕</button>
          </div>

          {/* Child selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Child</label>
            <select
              value={childId}
              onChange={e => setChildId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select a child…</option>
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Incident type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Incident type</label>
            <select
              value={incidentType}
              onChange={e => setIncidentType(e.target.value as IncidentType)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {INCIDENT_KEYS.map(key => (
                <option key={key} value={key}>{INCIDENT_TYPES[key]}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe what happened…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Save Incident
            </button>
            <button
              onClick={() => { setOpen(false); reset(); }}
              className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
