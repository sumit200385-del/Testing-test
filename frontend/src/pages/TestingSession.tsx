import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle, Save, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronRight, AlertCircle
} from 'lucide-react';
import api from '../api/client';
import { TestingSession as Session, TestCase } from '../types';
import { TestResultBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const SIGNOFF_ROLES: Record<number, string[]> = {
  1: ['rd_head', 'admin'],
  2: ['operations', 'admin'],
  3: ['sales', 'admin'],
};

const STAGE_LABELS: Record<number, string> = {
  1: 'Sanity Test — R&D Head Sign-off',
  2: 'Field Test — Operations Sign-off',
  3: 'Final — Sales Team Sign-off',
};

export default function TestingSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [caseForm, setCaseForm] = useState({ result: '', actual_value: '', remarks: '' });
  const [showSignoff, setShowSignoff] = useState(false);
  const [signoffForm, setSignoffForm] = useState({ decision: 'approved', comments: '' });
  const [signingOff, setSigningOff] = useState(false);

  useEffect(() => { load(); }, [id]);

  function load() {
    api.get(`/testing/${id}`).then(r => {
      setSession(r.data);
      setLoading(false);
    });
  }

  const canEdit = session?.status === 'in_progress';
  const canComplete = canEdit && session?.test_cases?.every(t => t.result !== 'pending');
  const canSignoff = session?.status === 'completed' &&
    SIGNOFF_ROLES[session.stage]?.includes(user?.role || '');

  const grouped = useMemo(() => {
    if (!session?.test_cases) return {};
    return session.test_cases.reduce<Record<string, TestCase[]>>((acc, tc) => {
      if (!acc[tc.category]) acc[tc.category] = [];
      acc[tc.category].push(tc);
      return acc;
    }, {});
  }, [session?.test_cases]);

  const stats = useMemo(() => {
    const cases = session?.test_cases || [];
    return {
      total: cases.length,
      pass: cases.filter(c => c.result === 'pass').length,
      fail: cases.filter(c => c.result === 'fail').length,
      skip: cases.filter(c => c.result === 'skip').length,
      pending: cases.filter(c => c.result === 'pending').length,
    };
  }, [session?.test_cases]);

  async function updateCase(tc: TestCase) {
    setSaving(tc.id);
    try {
      await api.put(`/testing/${id}/case/${tc.id}`, {
        result: caseForm.result || tc.result,
        actual_value: caseForm.actual_value || tc.actual_value,
        remarks: caseForm.remarks || tc.remarks,
      });
      setEditingCase(null);
      load();
    } finally {
      setSaving(null);
    }
  }

  async function quickResult(tc: TestCase, result: string) {
    setSaving(tc.id);
    try {
      await api.put(`/testing/${id}/case/${tc.id}`, { result });
      load();
    } finally {
      setSaving(null);
    }
  }

  async function completeSession() {
    if (!confirm('Mark this testing session as complete? All test cases must be filled.')) return;
    setCompleting(true);
    try {
      await api.post(`/testing/${id}/complete`);
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
    } finally {
      setCompleting(false);
    }
  }

  async function submitSignoff(e: React.FormEvent) {
    e.preventDefault();
    setSigningOff(true);
    try {
      await api.post('/signoff/sign', {
        firmware_id: session?.firmware_id,
        session_id: id,
        stage: session?.stage,
        decision: signoffForm.decision,
        comments: signoffForm.comments,
      });
      setShowSignoff(false);
      load();
      navigate(-1);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Sign-off failed');
    } finally {
      setSigningOff(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Loading…</div>;
  if (!session) return <div className="p-8 text-center text-sm text-gray-500">Session not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="btn-secondary !px-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">
            Stage {session.stage} — {STAGE_LABELS[session.stage]}
          </h1>
          <p className="text-xs text-gray-500">
            {session.firmware_version} &bull; {session.device_model} &bull; Tester: {session.tester_name}
          </p>
        </div>
        <span className={clsx('badge', {
          'bg-yellow-100 text-yellow-700': session.status === 'in_progress',
          'bg-blue-100 text-blue-700':    session.status === 'completed',
          'bg-green-100 text-green-700':  session.status === 'signed_off',
          'bg-red-100 text-red-700':      session.status === 'rejected',
        })}>{session.status.replace('_', ' ')}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {[
          { label: 'Total',   value: stats.total,   cls: 'bg-gray-100 text-gray-700' },
          { label: 'Pass',    value: stats.pass,    cls: 'bg-green-100 text-green-700' },
          { label: 'Fail',    value: stats.fail,    cls: 'bg-red-100 text-red-700' },
          { label: 'Skip',    value: stats.skip,    cls: 'bg-yellow-100 text-yellow-700' },
          { label: 'Pending', value: stats.pending, cls: 'bg-gray-100 text-gray-500' },
        ].map(s => (
          <div key={s.label} className={clsx('rounded-lg p-2 text-center', s.cls)}>
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {canComplete && (
          <button onClick={completeSession} disabled={completing} className="btn-success !text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completing ? 'Completing…' : 'Mark Session Complete'}
          </button>
        )}
        {canSignoff && (
          <button onClick={() => setShowSignoff(true)} className="btn-primary !text-xs">
            <Save className="w-3.5 h-3.5" /> Sign Off
          </button>
        )}
        {stats.pending > 0 && canEdit && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {stats.pending} tests pending
          </div>
        )}
      </div>

      {/* Sign-off form */}
      {showSignoff && (
        <div className="card p-5 mb-5 border-blue-200 bg-blue-50">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Stage {session.stage} Sign-off</h3>
          <form onSubmit={submitSignoff} className="space-y-3">
            <div className="flex gap-3">
              {['approved', 'rejected'].map(d => (
                <label key={d} className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors',
                  signoffForm.decision === d
                    ? d === 'approved' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600'
                )}>
                  <input type="radio" className="sr-only" checked={signoffForm.decision === d}
                    onChange={() => setSignoffForm(p => ({ ...p, decision: d }))} />
                  {d === 'approved' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </label>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Comments</label>
              <textarea value={signoffForm.comments} onChange={e => setSignoffForm(p => ({ ...p, comments: e.target.value }))}
                rows={3} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add sign-off comments…" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={signingOff}
                className={signoffForm.decision === 'approved' ? 'btn-success !text-xs' : 'btn-danger !text-xs'}>
                {signingOff ? 'Signing…' : `Confirm ${signoffForm.decision === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
              <button type="button" onClick={() => setShowSignoff(false)} className="btn-secondary !text-xs">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Test Cases */}
      {Object.entries(grouped).map(([category, cases]) => {
        const isOpen = !collapsed[category];
        const catStats = {
          pass: cases.filter(c => c.result === 'pass').length,
          fail: cases.filter(c => c.result === 'fail').length,
          pending: cases.filter(c => c.result === 'pending').length,
        };

        return (
          <div key={category} className="card mb-3">
            <button
              onClick={() => setCollapsed(p => ({ ...p, [category]: !p[category] }))}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors rounded-t-xl"
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span className="text-sm font-semibold text-gray-800">{category}</span>
                <span className="text-xs text-gray-500">({cases.length} tests)</span>
              </div>
              <div className="flex gap-1">
                {catStats.fail > 0 && <span className="badge bg-red-100 text-red-700">{catStats.fail} fail</span>}
                {catStats.pass > 0 && <span className="badge bg-green-100 text-green-700">{catStats.pass} pass</span>}
                {catStats.pending > 0 && <span className="badge bg-gray-100 text-gray-500">{catStats.pending} pending</span>}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {cases.map(tc => (
                  <div key={tc.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{tc.test_name}</span>
                          <TestResultBadge result={tc.result} />
                        </div>
                        {tc.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{tc.description}</p>
                        )}
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          {tc.expected_value && <span>Expected: <span className="text-gray-700">{tc.expected_value}</span></span>}
                          {tc.actual_value && <span>Actual: <span className="text-gray-700">{tc.actual_value}</span></span>}
                        </div>
                        {tc.remarks && <p className="text-xs text-gray-600 mt-0.5 italic">{tc.remarks}</p>}
                      </div>

                      {canEdit && editingCase !== tc.id && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => quickResult(tc, 'pass')} disabled={saving === tc.id}
                            className={clsx('p-1.5 rounded-lg transition-colors', tc.result === 'pass' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600')}>
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => quickResult(tc, 'fail')} disabled={saving === tc.id}
                            className={clsx('p-1.5 rounded-lg transition-colors', tc.result === 'fail' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-red-50 hover:text-red-600')}>
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => quickResult(tc, 'skip')} disabled={saving === tc.id}
                            className={clsx('p-1.5 rounded-lg transition-colors', tc.result === 'skip' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600')}>
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingCase(tc.id); setCaseForm({ result: tc.result, actual_value: tc.actual_value || '', remarks: tc.remarks || '' }); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors text-xs border border-gray-200"
                          >
                            Detail
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCase === tc.id && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex gap-2">
                          {['pass', 'fail', 'skip'].map(r => (
                            <label key={r} className={clsx(
                              'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors',
                              caseForm.result === r
                                ? r === 'pass' ? 'bg-green-100 border-green-400 text-green-700' :
                                  r === 'fail' ? 'bg-red-100 border-red-400 text-red-700' :
                                  'bg-yellow-100 border-yellow-400 text-yellow-700'
                                : 'bg-white border-gray-300 text-gray-600'
                            )}>
                              <input type="radio" className="sr-only" checked={caseForm.result === r}
                                onChange={() => setCaseForm(p => ({ ...p, result: r }))} />
                              {r.toUpperCase()}
                            </label>
                          ))}
                        </div>
                        <input
                          value={caseForm.actual_value}
                          onChange={e => setCaseForm(p => ({ ...p, actual_value: e.target.value }))}
                          placeholder="Actual value / observation"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          value={caseForm.remarks}
                          onChange={e => setCaseForm(p => ({ ...p, remarks: e.target.value }))}
                          placeholder="Remarks / notes"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => updateCase(tc)} disabled={saving === tc.id} className="btn-primary !text-xs !py-1">
                            {saving === tc.id ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingCase(null)} className="btn-secondary !text-xs !py-1">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
