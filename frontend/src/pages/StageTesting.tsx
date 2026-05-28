import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckSquare, FlaskConical, Car, Award } from 'lucide-react';
import api from '../api/client';
import { Firmware, TestingSession } from '../types';
import { FirmwareStatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

interface Props { stage: 1 | 2 | 3 }

const STAGE_CONFIG = {
  1: {
    title: 'Stage 1 — Sanity Testing',
    subtitle: 'Lab & bench-level validation. Sign-off by R&D Head.',
    icon: FlaskConical,
    requiredStatus: 'stage1_pending',
    allowedRoles: ['admin', 'rd_engineer', 'rd_head'],
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  2: {
    title: 'Stage 2 — Field Testing',
    subtitle: 'Real-world deployment testing. Sign-off by Operations.',
    icon: Car,
    requiredStatus: 'stage2_pending',
    allowedRoles: ['admin', 'operations', 'rd_head'],
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  3: {
    title: 'Stage 3 — Final Sign-off',
    subtitle: 'Tracking application & field validation. Sign-off by Sales Team.',
    icon: Award,
    requiredStatus: 'stage3_pending',
    allowedRoles: ['admin', 'sales', 'operations'],
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
} as const;

export default function StageTesting({ stage }: Props) {
  const cfg = STAGE_CONFIG[stage];
  const { user } = useAuth();
  const [firmware, setFirmware] = useState<Firmware[]>([]);
  const [sessions, setSessions] = useState<TestingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  const canStart = cfg.allowedRoles.includes((user?.role || '') as never);

  useEffect(() => {
    Promise.all([
      api.get('/firmware'),
    ]).then(([fwRes]) => {
      setFirmware(fwRes.data);
      setLoading(false);
    });
  }, []);

  const eligible = useMemo(
    () => firmware.filter(f => f.status === cfg.requiredStatus),
    [firmware, cfg.requiredStatus]
  );

  async function startSession(firmwareId: string) {
    setStarting(firmwareId);
    try {
      const res = await api.post('/testing/start', { firmware_id: firmwareId, stage });
      window.location.href = `/testing/${res.data.id}`;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to start session';
      alert(msg);
    } finally {
      setStarting(null);
    }
  }

  const Icon = cfg.icon;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{cfg.title}</h1>
          <p className="text-sm text-gray-500">{cfg.subtitle}</p>
        </div>
      </div>

      {/* Eligible Firmware */}
      <div className="card mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Firmware Awaiting Stage {stage} Testing
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : eligible.length === 0 ? (
          <div className="p-8 text-center">
            <CheckSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No firmware pending for Stage {stage} testing.</p>
            {stage > 1 && (
              <p className="text-xs text-gray-400 mt-1">Complete Stage {stage - 1} testing and sign-off first.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {eligible.map(fw => (
              <div key={fw.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div>
                  <Link to={`/firmware/${fw.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {fw.version}
                  </Link>
                  <div className="text-xs text-gray-500">{fw.device_model} &bull; {fw.platform}</div>
                </div>
                <FirmwareStatusBadge status={fw.status} />
                {canStart && (
                  <button
                    onClick={() => startSession(fw.id)}
                    disabled={starting === fw.id}
                    className="btn-primary !text-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {starting === fw.id ? 'Starting…' : 'Start Testing'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All firmware for this stage context */}
      <div className="card">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">All Active Sessions (Stage {stage})</h2>
        </div>
        <ActiveSessions stage={stage} />
      </div>
    </div>
  );
}

function ActiveSessions({ stage }: { stage: 1 | 2 | 3 }) {
  const [sessions, setSessions] = useState<TestingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/firmware').then(async fwRes => {
      const all: TestingSession[] = [];
      for (const fw of fwRes.data) {
        try {
          const r = await api.get(`/testing/firmware/${fw.id}`);
          all.push(...r.data.filter((s: TestingSession) => s.stage === stage));
        } catch {}
      }
      setSessions(all.sort((a, b) => b.started_at.localeCompare(a.started_at)));
      setLoading(false);
    });
  }, [stage]);

  if (loading) return <div className="p-6 text-center text-sm text-gray-400">Loading…</div>;
  if (sessions.length === 0) return <div className="p-6 text-center text-sm text-gray-500">No sessions yet.</div>;

  return (
    <div className="divide-y divide-gray-50">
      {sessions.map(s => (
        <Link
          key={s.id}
          to={`/testing/${s.id}`}
          className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
        >
          <div>
            <div className="text-sm font-medium text-gray-900">{s.firmware_version} &bull; {s.device_model}</div>
            <div className="text-xs text-gray-500">Tester: {s.tester_name} &bull; {new Date(s.started_at).toLocaleString()}</div>
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
  );
}
