import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, FlaskConical, Car, Award, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Firmware } from '../types';
import { FirmwareStatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [firmware, setFirmware] = useState<Firmware[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/firmware').then(r => { setFirmware(r.data); setLoading(false); });
  }, []);

  const stats = {
    total: firmware.length,
    approved: firmware.filter(f => f.status === 'approved').length,
    inProgress: firmware.filter(f => !['draft', 'approved', 'rejected', 'stage1_failed', 'stage2_failed'].includes(f.status)).length,
    failed: firmware.filter(f => ['stage1_failed', 'stage2_failed', 'rejected'].includes(f.status)).length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome, {user?.name} &mdash; VTD Firmware Testing Protocol (abckedn)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Cpu,         label: 'Total Firmware',    value: stats.total,      color: 'text-blue-600',  bg: 'bg-blue-50' },
          { icon: Clock,       label: 'In Progress',       value: stats.inProgress, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { icon: CheckCircle, label: 'Approved',          value: stats.approved,   color: 'text-green-600', bg: 'bg-green-50' },
          { icon: XCircle,     label: 'Failed/Rejected',   value: stats.failed,     color: 'text-red-600',   bg: 'bg-red-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Sign-off Pipeline */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Sign-off Pipeline</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Stage 1\nSanity Test', role: 'R&D Head', icon: FlaskConical, color: 'bg-blue-600' },
            { label: 'Stage 2\nField Test',  role: 'Operations',  icon: Car,          color: 'bg-orange-500' },
            { label: 'Stage 3\nFinal',       role: 'Sales Team',  icon: Award,        color: 'bg-purple-600' },
          ].map(({ label, role, icon: Icon, color }, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-1 min-w-48">
                <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-800 whitespace-pre-line">{label}</div>
                  <div className="text-xs text-gray-500">Sign-off: {role}</div>
                </div>
              </div>
              {i < 2 && <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent Firmware */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Firmware Versions</h2>
          <Link to="/firmware" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : firmware.length === 0 ? (
          <div className="p-8 text-center">
            <Cpu className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No firmware versions yet</p>
            <Link to="/firmware" className="btn-primary mt-3 text-xs">Add Firmware</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {firmware.slice(0, 8).map(fw => (
              <Link
                key={fw.id}
                to={`/firmware/${fw.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{fw.version}</div>
                  <div className="text-xs text-gray-500">{fw.device_model} &mdash; {new Date(fw.created_at).toLocaleDateString()}</div>
                </div>
                <FirmwareStatusBadge status={fw.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
