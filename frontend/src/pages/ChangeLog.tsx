import React, { useEffect, useState } from 'react';
import { ClipboardList, Filter } from 'lucide-react';
import api from '../api/client';
import { ChangeLogEntry } from '../types';

const ACTION_COLORS: Record<string, string> = {
  created:        'bg-green-100 text-green-700',
  updated:        'bg-blue-100 text-blue-700',
  status_changed: 'bg-purple-100 text-purple-700',
  completed:      'bg-indigo-100 text-indigo-700',
};

export default function ChangeLog() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/changelog?limit=200').then(r => {
      setEntries(r.data);
      setLoading(false);
    });
  }, []);

  const filtered = entries.filter(e =>
    !filter ||
    e.entity_type.includes(filter.toLowerCase()) ||
    e.action.includes(filter.toLowerCase()) ||
    e.changed_by_name.toLowerCase().includes(filter.toLowerCase()) ||
    (e.details || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Change Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">Full audit trail of all changes</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by entity, action, or user…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No changes recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(e => (
              <div key={e.id} className="px-4 py-3 flex gap-3">
                <div className="w-24 flex-shrink-0 pt-0.5">
                  <span className={`badge ${ACTION_COLORS[e.action] || 'bg-gray-100 text-gray-600'}`}>
                    {e.action.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">{e.details || `${e.entity_type} ${e.action}`}</div>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{e.changed_by_name}</span>
                      {' '}&bull;{' '}
                      {new Date(e.changed_at).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{e.entity_type.replace('_', ' ')}</span>
                  </div>
                  {(e.old_value || e.new_value) && (
                    <div className="mt-1 flex gap-3 text-xs">
                      {e.old_value && (
                        <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          Before: {JSON.stringify(e.old_value)}
                        </span>
                      )}
                      {e.new_value && (
                        <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                          After: {JSON.stringify(e.new_value)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
