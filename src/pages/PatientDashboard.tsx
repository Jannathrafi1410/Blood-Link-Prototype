import React, { useState, useEffect } from 'react';
import { EmergencyRequest, Hospital, BloodBank } from '../types';
import { api } from '../services/api';
import { Mascot } from '../components/Mascot';
import { StatusBadge } from '../components/StatusBadge';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { RelayChatModal } from '../components/RelayChatModal';
import { CompatibilityWidget } from '../components/CompatibilityWidget';
import {
  Siren,
  Building2,
  Clock,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  MapPin,
  Heart
} from 'lucide-react';

interface PatientDashboardProps {
  onOpenSosModal: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onOpenSosModal }) => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [hospitals, setHospitals] = useState<Array<Hospital & { distanceKm: number }>>([]);
  const [bloodBanks, setBloodBanks] = useState<Array<BloodBank & { distanceKm: number; inventorySummary: string }>>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isRelayOpen, setIsRelayOpen] = useState(false);

  const loadData = async () => {
    try {
      const [allReqs, hosps, banks] = await Promise.all([
        api.getRequests(),
        api.getNearbyHospitals('680001'),
        api.getNearbyBanks('680001')
      ]);
      setRequests(allReqs);
      setHospitals(hosps.slice(0, 4));
      setBloodBanks(banks.slice(0, 4));

      // Prefer patient created or active request
      const active = allReqs.find(r => r.requesterRole === 'PATIENT') || allReqs[0];
      if (active) {
        setSelectedRequestId(active.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeRequest = requests.find(r => r.id === selectedRequestId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Empathetic Emergency Assistance Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Mascot size="lg" mood="alert" speechBubble="We are searching nearby blood banks and verified donors for you." />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Emergency Family Assistance Desk</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Welcome, Lakshmi Menon. This console tracks your family&apos;s emergency blood requirements in real time. We directly query verified hospital blood banks and mobilize eligible local donors.
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Free Public Humanitarian Service · Transfusion Security Protected</span>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={onOpenSosModal}
            className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-transform hover:scale-102"
          >
            <Siren className="w-5 h-5 animate-pulse" />
            <span>Create Emergency Blood SOS</span>
          </button>
        </div>
      </div>

      {/* Active Request Tracker */}
      {activeRequest ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xl font-bold text-slate-900">
                  {activeRequest.id}
                </span>
                <StatusBadge status={activeRequest.status} />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Hospital: <strong>{activeRequest.hospitalName}</strong> · PIN {activeRequest.pincode}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500">Required Blood</div>
                <div className="text-xl font-black text-red-600">
                  {activeRequest.bloodGroup} {activeRequest.component}
                </div>
              </div>
              <button
                onClick={() => setIsRelayOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Hospital & Volunteer Relay</span>
              </button>
            </div>
          </div>

          {/* Pending Verification Notice for Patient Requests (Section 12 requirement) */}
          {activeRequest.verificationState === 'UNVERIFIED' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Hospital Clinical Confirmation In Progress</p>
                <p className="mt-0.5 text-amber-800">
                  Our system is actively querying local blood banks for matching units. To ensure clinical safety and prevent false alerts, donor SOS notifications will be dispatched as soon as the hospital medical desk or an administrator confirms your request.
                </p>
              </div>
            </div>
          )}

          {/* Fulfilment Progress */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Transfusion Fulfilment:</span>
              <span>
                {activeRequest.unitsFulfilled} of {activeRequest.unitsRequested} Units Secured
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (activeRequest.unitsFulfilled / (activeRequest.unitsRequested || 1)) * 100
                  )}%`
                }}
              />
            </div>
          </div>

          <MedicalDisclaimer compact />
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
          No current emergency requests found. Click &quot;Create Emergency Blood SOS&quot; above to search.
        </div>
      )}

      {/* Two Column Grid: Nearest Verified Hospitals & Stock Availability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nearest Hospitals with 24/7 Transfusion */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-600" />
            <span>Nearest Verified Emergency Hospitals</span>
          </h3>

          <div className="space-y-3">
            {hospitals.map(h => (
              <div key={h.id} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-start justify-between font-semibold text-slate-900">
                  <span>{h.name}</span>
                  <span className="text-red-600 font-bold">{h.distanceKm?.toFixed(1)} km</span>
                </div>
                <div className="text-slate-500">
                  PIN {h.pincode} ({h.district}) · {h.traumaLevel}
                </div>
                <div className="pt-2 flex items-center justify-between text-slate-700">
                  <span className="text-[11px] font-medium text-emerald-700">24/7 Emergency Transfusion Desk</span>
                  <a
                    href={`tel:${h.emergencyDepartmentPhone || h.phone}`}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:text-red-600"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                    <span>{h.emergencyDepartmentPhone || h.phone || 'Direct Desk'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Blood Banks Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-600" />
            <span>District Blood Bank Inventory Status</span>
          </h3>

          <div className="space-y-3">
            {bloodBanks.map(b => (
              <div key={b.id} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-start justify-between font-semibold text-slate-900">
                  <span>{b.name}</span>
                  <span className="text-emerald-700 font-bold">{b.distanceKm?.toFixed(1)} km</span>
                </div>
                <div className="text-slate-500">
                  Licensed Transfusion Centre · PIN {b.pincode}
                </div>
                <div className="pt-2 text-slate-700 font-medium">
                  <strong>Stock Summary:</strong> {b.inventorySummary}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Compatibility Calculator for Patients */}
      <CompatibilityWidget />

      {/* Relay Modal */}
      {activeRequest && isRelayOpen && (
        <RelayChatModal
          requestId={activeRequest.id}
          userRole="PATIENT"
          isOpen={isRelayOpen}
          onClose={() => setIsRelayOpen(false)}
        />
      )}
    </div>
  );
};
