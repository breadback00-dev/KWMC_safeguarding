import Link from 'next/link';
import { getAllIncidents } from '@/lib/queries/safeguarding';
import { getActiveChildren } from '@/lib/queries/children';
import { LogIncidentForm } from '@/components/safeguarding/LogIncidentForm';
import { INCIDENT_TYPES } from '@/types';

export const metadata = { title: 'Safeguarding — Community Hub' };

export default async function SafeguardingPage() {
  const [incidents, allChildren] = await Promise.all([
    getAllIncidents(),
    getActiveChildren(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Safeguarding Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">All staff-recorded incidents, newest first.</p>
        </div>
        <a
          href="/api/safeguarding/export"
          download
          className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800
                     border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
        >
          Export All CSV
        </a>
      </div>

      {/* Log new incident form */}
      <LogIncidentForm children={allChildren} />

      {/* Incident history table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {incidents.length === 0 ? (
          <p className="px-6 py-12 text-center text-gray-400">No incidents recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">Date &amp; Time</th>
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
                      {new Date(incident.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
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
                      <p>{incident.amended_notes ?? incident.notes}</p>
                      {incident.amended_notes && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Amended by {incident.amended_by}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{incident.created_by}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/api/children/${incident.child_id}/safeguarding-report`}
                        className="text-xs text-gray-400 hover:text-blue-600 font-medium transition-colors whitespace-nowrap"
                        download
                      >
                        Child report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
