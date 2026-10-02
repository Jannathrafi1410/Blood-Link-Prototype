import React, { useState, useEffect } from 'react';
import { SystemMetrics, AuditLogEntry, CompatibilityRule } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Settings,
  ShieldCheck,
  Activity,
  FileText,
  Sliders,
  Play,
  RotateCcw,
  FastForward,
  Eye,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Users,
  Search
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'audit' | 'settings' | 'compatibility'>('analytics');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [rules, setRules] = useState<CompatibilityRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  // Unmask modal state
  const [unmaskUserId, setUnmaskUserId] = useState<string | null>(null);
  const [unmaskReason, setUnmaskReason] = useState('');
  const [unmaskedData, setUnmaskedData] = useState<any>(null);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [m, u, a, s, r] = await Promise.all([
        api.getAnalytics(),
        api.getAdminUsers(),
        api.getAuditLogs(),
        api.getAdminSettings(),
        api.getCompatibilityRules()
      ]);
      setMetrics(m);
      setUsers(u);
      setAuditLogs(a);
      setSettings(s);
      setRules(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleVerifyUser = async (userId: string, newStatus: string) => {
    try {
      await api.verifyUser(userId, newStatus);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status');
    }
  };

  const handleUnmaskPii = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unmaskUserId) return;
    try {
      const res = await api.unmaskUserPii(unmaskUserId, unmaskReason);
      setUnmaskedData(res.user);
      loadAllAdminData(); // reloads audit log showing the reason!
    } catch (err: any) {
      alert(err.message || 'Failed to unmask PII');
    }
  };

  const handleRunThrissurDemo = async () => {
    try {
      const res = await api.runThrissurDemo();
      setDemoBanner(
        `Thrissur Benchmark Scenario Executed: ${res.pipeline.potentialInThrissur} potential -> ${res.pipeline.eligibleDonors} eligible -> ${res.pipeline.within5kmRadius} within 5 km -> ${res.pipeline.wave1Notified} notified -> ${res.pipeline.accepted} accepted (Candidate D-014).`
      );
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Demo run failed');
    }
  };

  const handleFastForward = async () => {
    try {
      await api.fastForwardTimeout();
      setDemoBanner('Notification timeout window fast-forwarded. Escalation event recorded in audit logs.');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Fast forward failed');
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      setDemoBanner('Demo dataset and matching engine re-initialized to default baseline.');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header with DEMO Controls (Section 25) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">System Administration Console</h1>
            <span className="text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded uppercase">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            RBAC governance, hospital/bank verification, algorithmic tuning, and audit surveillance
          </p>
        </div>

        {/* DEMO Control Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
          <span className="text-[11px] font-mono text-amber-400 font-bold px-2">DEMO CONTROLS:</span>
          <button
            onClick={handleRunThrissurDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
            title="Execute Thrissur O- Benchmark Scenario"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run Thrissur Demo</span>
          </button>
          <button
            onClick={handleFastForward}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
            title="Simulate 180s Timeout Escalation"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Fast-Forward Timeout</span>
          </button>
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
            title="Reset All Data to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Demo Outcome Banner */}
      {demoBanner && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{demoBanner}</span>
          </div>
          <button onClick={() => setDemoBanner(null)} className="font-bold text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Analytics & Performance</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Verification</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log Trail</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matching Config</span>
        </button>
        <button
          onClick={() => setActiveTab('compatibility')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'compatibility'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Compatibility Matrix</span>
        </button>
      </div>

      {/* Tab 1: Analytics (Section 26 & 37) */}
      {activeTab === 'analytics' && metrics && (
        <div className="space-y-6">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            <strong>NOTICE:</strong> SIMULATED DEMO DATA — NOT MEASURED RESULTS (Section 26 compliance requirement).
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="text-xs text-slate-500">Fulfilment Rate</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.fulfilmentRate}%</div>
              <div className="text-[11px] text-emerald-700 mt-1">Target benchmark &gt; 90%</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="text-xs text-slate-500">Donor Response Rate</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.responseRate}%</div>
              <div className="text-[11px] text-emerald-700 mt-1">Within 180s timeout wave</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="text-xs text-slate-500">Average Match Time</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.avgMatchTimeSeconds}s</div>
              <div className="text-[11px] text-blue-600 mt-1">Algorithmic Stage 1 & 2</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="text-xs text-slate-500">Average Fulfilment Time</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.avgFulfilmentMinutes}m</div>
              <div className="text-[11px] text-slate-500 mt-1">Request to Transfusion ready</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase">Active Donors Network</div>
              <div className="text-xl font-bold text-slate-900 mt-2">{metrics.activeDonors} Volunteers</div>
              <div className="text-xs text-slate-500 mt-1">842 Seeded across India</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase">Licensed Blood Centres</div>
              <div className="text-xl font-bold text-slate-900 mt-2">{metrics.activeBloodBanks} Facilities</div>
              <div className="text-xs text-slate-500 mt-1">12 State / District Banks</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase">Matching Accuracy</div>
              <div className="text-xl font-bold text-emerald-700 mt-2">{metrics.matchingAccuracy}%</div>
              <div className="text-xs text-slate-500 mt-1">Valid matches / Generated matches × 100</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users & PII Masking & Reason-Required Unmasking (Section 24 & 45) */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                User Directory & Verification Queue
              </h2>
              <p className="text-xs text-slate-500">
                PII is masked by default. Revealing personal information requires a recorded clinical justification.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Masked Contact</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Pincode</th>
                  <th className="py-3 px-6">Verification</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div>{u.name}</div>
                      {u.entityName && <div className="text-[11px] text-slate-500 font-normal">{u.entityName}</div>}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">
                      {u.pincode}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={u.verificationStatus} />
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setUnmaskUserId(u.id);
                          setUnmaskReason('');
                          setUnmaskedData(null);
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Unmask PII (Requires Reason)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {u.verificationStatus === 'PENDING' && (
                        <button
                          onClick={() => handleVerifyUser(u.id, 'TRUSTED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                        >
                          Verify ✓
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs (Section 6 & 24) */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Immutable Security & Matching Audit Log
            </h2>
            <p className="text-xs text-slate-500">
              Tracks all authentications, PII unmasking justifications, matching waves, and SOS notifications
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Actor (Role)</th>
                  <th className="py-3 px-6">Details</th>
                  <th className="py-3 px-6">Unmask Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {log.userId} ({log.userRole})
                    </td>
                    <td className="py-3 px-6 text-slate-700 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-3 px-6 text-red-600">
                      {log.piiUnmaskedReason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Matching Engine Configuration (Section 16 & 17) */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Two-Stage Matching & Radius Escalation Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                First Wave Radius (km)
              </label>
              <input
                type="number"
                value={settings.firstWaveRadiusKm}
                onChange={e => setSettings({ ...settings, firstWaveRadiusKm: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-500">Default: 5 km</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Second Wave Escalation Radius (km)
              </label>
              <input
                type="number"
                value={settings.secondWaveRadiusKm}
                onChange={e => setSettings({ ...settings, secondWaveRadiusKm: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-500">Default: 10 km</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Notification Timeout Window (Seconds)
              </label>
              <input
                type="number"
                value={settings.notificationTimeoutSeconds}
                onChange={e => setSettings({ ...settings, notificationTimeoutSeconds: parseInt(e.target.value) || 180 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-500">Default: 180s before next wave</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Candidates Notified per Wave
              </label>
              <input
                type="number"
                value={settings.maxWaveCandidates}
                onChange={e => setSettings({ ...settings, maxWaveCandidates: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-500">Anti-spam ceiling (Section 17: Capped at 3)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={async () => {
                await api.updateAdminSettings(settings);
                alert('Matching configuration updated.');
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Compatibility Matrix (Section 15) */}
      {activeTab === 'compatibility' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Component-Specific Blood Compatibility Rules
            </h2>
            <p className="text-xs text-slate-500">
              Red Cells, Whole Blood, Plasma, Platelets rules with mandatory clinical review flags
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Component</th>
                  <th className="py-3 px-6">Recipient Group</th>
                  <th className="py-3 px-6">Compatible Donor Groups</th>
                  <th className="py-3 px-6">Medical Review Required</th>
                  <th className="py-3 px-6">Clinical Guidelines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6 font-semibold text-slate-900">
                      {r.component}
                    </td>
                    <td className="py-3 px-6 font-extrabold text-red-600">
                      {r.recipientGroup}
                    </td>
                    <td className="py-3 px-6 font-semibold text-slate-700">
                      {r.compatibleDonorGroups.join(', ')}
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Mandatory Review ✓
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {r.guidelines}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmask Modal (Section 24 & 45 requirement) */}
      {unmaskUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <Lock className="w-5 h-5" />
              <span>Restricted PII Access (Audit Monitored)</span>
            </div>

            <p className="text-xs text-slate-600">
              Access to donor/user telephone numbers, email addresses, and location is strictly logged. You must provide a valid clinical or legal justification.
            </p>

            {unmaskedData ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                <div className="text-emerald-700 font-bold mb-2">Unmasking Authorized:</div>
                <div>Name: {unmaskedData.name}</div>
                <div>Email: {unmaskedData.email}</div>
                <div>Phone: {unmaskedData.phone}</div>
                <div>Role: {unmaskedData.role}</div>
                <div>Pincode: {unmaskedData.pincode}</div>
              </div>
            ) : (
              <form onSubmit={handleUnmaskPii} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Justification Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={unmaskReason}
                    onChange={e => setUnmaskReason(e.target.value)}
                    placeholder="e.g. Critical life-safety patient transfer coordination"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUnmaskUserId(null)}
                    className="px-4 py-2 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                  >
                    Confirm & Record Audit
                  </button>
                </div>
              </form>
            )}

            {unmaskedData && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setUnmaskUserId(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
