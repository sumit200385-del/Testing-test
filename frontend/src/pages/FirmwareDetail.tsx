import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Edit2, Save, X } from 'lucide-react';
import api from '../api/client';
import { Firmware } from '../types';
import { FirmwareStatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

const STAGE_LABELS: Record<number, string> = { 1: 'Sanity Test', 2: 'Field Test', 3: 'Final Sign-off' };
const DECISION_CFG = {
  approved: { icon: CheckCircle, cls: 'text-green-600' },
  rejected: { icon: XCircle,     cls: 'text-red-600' },
};

export default function FirmwareDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fw, setFw] = useState<Firmware | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ version: '', device_model: '', description: '', release_notes: '' });

  useEffect(() => { load(); }, [id]);

  function load() {
    api.get(`/firmware/${id}`).then(r => {
      setFw(r.data);
      setEditForm({
        version: r.data.version,
        device_model: r.data.device_model,
        description: r.data.description || '',
        release_notes: r.data.release_notes || '',
      });
      setLoading(false);
    });
  }

  async function handleSubmit() {
    if (!confirm('Submit this firmware for Stage 1 Sanity Testing?')) return;
    setSubmitting(true);
    try {
      await api.post(`/firmware/${id}/submit`);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    await api.put(`/firmware/${id}`, editForm);
    setEditing(false);
    load();
  }

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Loading…</div>;
  if (!fw) return <div className="p-8 text-center text-sm text-gray-500">Not found</div>;

  const canEdit = ['admin', 'rd_engineer', 'rd_head'].includes(user?.role || '') && fw.status === 'draft';
  const canSubmit = canEdit && fw.status === 'draft';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary !px-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{fw.version}</h1>
            <FirmwareStatusBadge status={fw.status} />
          </div>
          <p className="text-sm text-gray-500">{fw.device_model} &bull; abckedn</p>
        </div>
        <div className="flex gap-2">
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary !text-xs">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {canSubmit && (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary !text-xs">
              <Send className="w-3.5 h-3.5" /> Submit for Testing
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="card p-5 mb-6">
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Version</label>
              <input value={editForm.version} onChange={e => setEditForm(p => ({ ...p, version: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Device Model</label>
              <input value={editForm.device_model} onChange={e => setEditForm(p => ({ ...p, device_model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Release Notes</label>
              <textarea value={editForm.release_notes} onChange={e => setEditForm(p => ({ ...p, release_notes: e.target.value }))}
                rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary !text-xs"><Save className="w-3.5 h-3.5" /> Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary !text-xs"><X className="w-3.5 h-3.5" /> Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-xs font-medium text-gray-500 mb-3">Firmware Details</div>
            <dl className="space-y-2 text-sm">
              {[
                ['Version', fw.version],
                ['Device Model', fw.device_model],
                ['Platform', fw.platform],
                ['Created By', fw.created_by_name],
                ['Created At', new Date(fw.created_at).toLocaleString()],
                ['Updated At', new Date(fw.updated_at).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4">
                  <dt className="text-gray-500 w-28 flex-shrink-0">{k}</dt>
                  <dd className="font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {(fw.description || fw.release_notes) && (
            <div className="card p-4">
              {fw.description && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Description</div>
                  <p className="text-sm text-gray-700">{fw.description}</p>
                </div>
              )}
              {fw.release_notes && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Release Notes</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{fw.release_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sign-off History */}
      {fw.signoffs && fw.signoffs.length > 0 && (
        <div className="card mb-4">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Sign-off History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {fw.signoffs.map(s => {
              const cfg = DECISION_CFG[s.decision];
              return (
                <div key={s.id} className="px-5 py-3 flex items-start gap-3">
                  <cfg.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.cls}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Stage {s.stage} — {STAGE_LABELS[s.stage]} &mdash; {s.decision.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.signed_by_name} ({s.signed_by_role}) &bull; {new Date(s.signed_at).toLocaleString()}
                    </div>
                    {s.comments && <div className="text-xs text-gray-600 mt-1">{s.comments}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Testing Sessions */}
      {fw.sessions && fw.sessions.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Testing Sessions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {fw.sessions.map(s => (
              <Link
                key={s.id}
                to={`/testing/${s.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Stage {s.stage} — {STAGE_LABELS[s.stage]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.tester_name} &bull; Started {new Date(s.started_at).toLocaleString()}
                  </div>
                </div>
                <span className={`badge ${
                  s.status === 'signed_off' ? 'bg-green-100 text-green-700' :
                  s.status === 'completed'  ? 'bg-blue-100 text-blue-700' :
                  s.status === 'rejected'   ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{s.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
