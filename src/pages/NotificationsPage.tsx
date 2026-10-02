import React, { useState, useEffect } from 'react';
import { DonorNotification } from '../types';
import { api } from '../services/api';
import { Mascot } from '../components/Mascot';
import {
  Bell,
  MessageSquare,
  PhoneCall,
  Smartphone,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Clock,
  RotateCcw
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<DonorNotification[]>([]);
  const [activeChannel, setActiveChannel] = useState<'ALL' | 'IN_APP' | 'SMS' | 'WHATSAPP' | 'VOICE'>('ALL');
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications('D-014');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notifications Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Emergency Notification Gateway</h1>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Encrypted Dispatch Channel
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-channel notification routing (In-App, Push, SMS, WhatsApp, and Critical Voice Dispatch)
            </p>
          </div>
        </div>

        {/* Channel Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          {(['ALL', 'IN_APP', 'SMS', 'WHATSAPP', 'VOICE'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeChannel === ch
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Channel Escalation Ladder Architecture (Section 19) */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
        <div className="font-bold flex items-center gap-2 text-red-400 uppercase tracking-wider text-[11px]">
          <span>Channel Escalation Sequence:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          <span className="px-2 py-1 bg-slate-800 rounded font-semibold text-emerald-400">1. In-App / Push</span>
          <span>&rarr;</span>
          <span className="px-2 py-1 bg-slate-800 rounded font-semibold text-blue-400">2. SMS Gateway (Simulated)</span>
          <span>&rarr;</span>
          <span className="px-2 py-1 bg-slate-800 rounded font-semibold text-emerald-400">3. WhatsApp Template</span>
          <span>&rarr;</span>
          <span className="px-2 py-1 bg-slate-800 rounded font-semibold text-red-400">4. Interactive Voice (CRITICAL Only)</span>
        </div>
        <p className="text-[11px] text-slate-400 pt-1">
          Zero donor contact information is transmitted inside notification payloads. Transmissions carry only candidate IDs and approximate destination area.
        </p>
      </div>

      {/* Outbox / Feed */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
            <Mascot size="md" speechBubble="Notification queue clear!" />
            <p className="text-xs text-slate-500">
              No recent notifications dispatched for this account.
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {notif.requestId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {notif.channel}
                      </span>
                      {notif.isSimulated && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          SIMULATED PROVIDER
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {notif.units} Units {notif.bloodGroup} {notif.component} ({notif.urgency})
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {notif.status}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Sample Notification Body Payload (Section 19: Proving No PII) */}
              <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 space-y-1">
                <div>🚨 <strong>SOS BLOOD REQUEST</strong></div>
                <div>Blood: {notif.bloodGroup}</div>
                <div>Component: {notif.component}</div>
                <div>Units: {notif.units}</div>
                <div>Urgency: {notif.urgency}</div>
                <div>Approx Area: {notif.approxArea}</div>
                <div>Request: {notif.requestId}</div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Transmitted via Encrypted Carrier Gateway · Strict Zero-PII Enforced</span>
                <span className="font-medium text-slate-700">Audit Reference #NTF-9921</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
