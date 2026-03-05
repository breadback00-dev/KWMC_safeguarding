import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Community Hub Dashboard</h1>
      {/* TODO: Implement Dashboard showing sessions, children list, and safeguarding log */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Sessions</h2>
          <p>Capacity, Registered, Checked-in</p>
        </div>
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Children</h2>
          <p>List of children arriving today</p>
        </div>
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Safeguarding Log</h2>
          <p>Recent events log</p>
        </div>
      </div>
    </div>
  );
}
