import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Cpu, Search } from 'lucide-react';
import api from '../api/client';
import { Firmware } from '../types';
import { FirmwareStatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

export default function FirmwareList() {
  const [firmware, setFirmware] = useState<Firmware[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ version: '', device_model: '', description: '', release_notes: '' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const canCreate = ['admin', 'rd_engineer', 'rd_head'].includes(user?.role || '');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api.get('/firmware').then(r => { setFirmware(r.data); setLoading(false); });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/firmware', form);
      setForm({ version: '', device_model: '', description: '', release_notes: '' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const filtered = firmware.filter(f =>
    f.version.toLowerCase().includes(query.toLowerCase()) ||
    f.device_model.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Firmware Versions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform: abckedn</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Firmware
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Register New Firmware Version</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Firmware Version *</label>
              <input
                value={form.version}
                onChange={e => setForm(p => ({ ...p, version: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. v2.4.1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Device Model *</label>
              <input
                value={form.device_model}
                onChange={e => setForm(p => ({ ...p, device_model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. VTD-PRO-4G"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Release Notes</label>
              <textarea
                value={form.release_notes}
                onChange={e => setForm(p => ({ ...p, release_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What changed in this version…"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create Firmware'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search firmware or device model…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Cpu className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{query ? 'No results' : 'No firmware versions yet'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-medium text-gray-600 text-xs">Version</th>
                <th className="px-4 py-2.5 font-medium text-gray-600 text-xs">Device Model</th>
                <th className="px-4 py-2.5 font-medium text-gray-600 text-xs hidden sm:table-cell">Platform</th>
                <th className="px-4 py-2.5 font-medium text-gray-600 text-xs">Status</th>
                <th className="px-4 py-2.5 font-medium text-gray-600 text-xs hidden md:table-cell">Created By</th>
                <th className="px-4 py-2.5 font-medium text-gray-600 text-xs hidden lg:table-cell">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(fw => (
                <tr key={fw.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/firmware/${fw.id}`} className="text-blue-600 hover:underline">{fw.version}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{fw.device_model}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{fw.platform}</td>
                  <td className="px-4 py-3"><FirmwareStatusBadge status={fw.status} /></td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{fw.created_by_name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{new Date(fw.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
