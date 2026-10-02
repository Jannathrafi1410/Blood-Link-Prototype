import React, { useState, useEffect } from 'react';
import { EmergencyRequest, CandidateMatch, Hospital, BloodBank, RequestEvent } from '../types';
import { api } from '../services/api';
import { CandidateTable } from '../components/CandidateTable';
import { StatusBadge } from '../components/StatusBadge';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { RelayChatModal } from '../components/RelayChatModal';
import { MapView } from '../components/MapView';
import { WaveTimer } from '../components/WaveTimer';
import { RouteSimulatorModal } from '../components/RouteSimulatorModal';
import {
  Siren,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Droplet
} from 'lucide-react';

interface HospitalDashboardProps {
  onOpenSosModal: () => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ onOpenSosModal }) => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [hospitals, setHospitals] = useState<Array<Hospital & { distanceKm: number }>>([]);
  const [bloodBanks, setBloodBanks] = useState<Array<BloodBank & { distanceKm: number; inventorySummary: string }>>([]);
  const [donorZones, setDonorZones] = useState<any[]>([]);
  const [relayCandidateId, setRelayCandidateId] = useState<string | null>(null);
  const [isRelayOpen, setIsRelayOpen] = useState(false);
  const [routeModalData, setRouteModalData] = useState<{
    isOpen: boolean;
    candidateId: string;
    distanceKm: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'unverified'>('all');

  const loadData = async () => {
    try {
      const [reqs, hosps, banks, zones] = await Promise.all([
        api.getRequests(),
        api.getNearbyHospitals('680001'),
        api.getNearbyBanks('680001'),
        api.getDonorZones()
      ]);

      setRequests(reqs);
      setHospitals(hosps);
      setBloodBanks(banks);
      setDonorZones(zones);

      // Default select benchmark BAN-10291 or first request
      const active = reqs.find(r => r.id === 'BAN-10291') || reqs[0];
      if (active) {
        handleSelectRequest(active.id);
      }
    } catch (err) {
      console.error('Failed to load hospital dashboard:', err);
    }
  };

  const handleSelectRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const detail = await api.getRequestById(requestId);
      setSelectedRequest(detail.request);
      setCandidates(detail.candidates);
      setEvents(detail.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRequest = async (requestId: string) => {
    try {
      const res = await api.confirmRequest(requestId);
      if (res.success) {
        handleSelectRequest(requestId);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Confirmation failed');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRequests = requests.filter(r => {
    if (filter === 'critical') return r.urgency === 'CRITICAL';
    if (filter === 'unverified') return r.verificationState === 'UNVERIFIED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hospital Facility Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">ABC Hospital, Thrissur</h1>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Verified Level 1 Trauma ✓
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transfusion Medicine & Emergency Triage Center · Pincode 680001 (Kerala) · License KER-MED-2021-9921
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Live Data</span>
          </button>
          <button
            onClick={onOpenSosModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
          >
            <Siren className="w-4 h-4 animate-pulse" />
            <span>New Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Active Requests on Left, Selected Request Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Requests List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Active Emergency Queue</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                {filteredRequests.length}
              </span>
            </h2>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === 'critical' ? 'bg-white text-red-600 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilter('unverified')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === 'unverified' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Unverified
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredRequests.map(req => {
              const isSelected = selectedRequest?.id === req.id;
              const isUnverified = req.verificationState === 'UNVERIFIED';

              return (
                <div
                  key={req.id}
                  onClick={() => handleSelectRequest(req.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50/40 border-red-500 ring-1 ring-red-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{req.id}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="text-xs text-slate-600 mt-1 font-medium">
                        {req.hospitalName} · PIN {req.pincode}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-red-600 bg-red-100/80 px-2 py-0.5 rounded">
                        {req.bloodGroup}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1 font-medium">
                        {req.component}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Units: <strong>{req.unitsFulfilled}/{req.unitsRequested}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  {isUnverified && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-amber-800">
                        Patient SOS (Awaiting Confirmation)
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleConfirmRequest(req.id);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                      >
                        Confirm & Dispatch
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Request Pipeline & Candidate Table (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedRequest ? (
            <>
              {/* Request Header Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold font-mono text-slate-900">
                        {selectedRequest.id}
                      </h2>
                      <StatusBadge status={selectedRequest.status} />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {selectedRequest.verificationState}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Case Ref: {selectedRequest.patientReferenceId || 'PT-EMERGENCY'} · Requester:{' '}
                      {selectedRequest.requesterName} ({selectedRequest.requesterRole})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                      {selectedRequest.bloodGroup}
                    </span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900">{selectedRequest.component}</div>
                      <div className="text-xs text-slate-500">{selectedRequest.unitsRequested} Units Needed</div>
                    </div>
                  </div>
                </div>

                {/* Notes if available */}
                {selectedRequest.notes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    <strong>Medical Triage Note:</strong> {selectedRequest.notes}
                  </div>
                )}

                {/* Bank First Allocation Notice */}
                {selectedRequest.matchedBankName && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Droplet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Units reserved from: <strong>{selectedRequest.matchedBankName}</strong></span>
                    </span>
                    <span className="font-bold text-emerald-700">Fulfilled at Bank ✓</span>
                  </div>
                )}
              </div>

              {/* Notification Wave Timer */}
              {(selectedRequest.status === 'DONORS_NOTIFIED' || selectedRequest.status === 'SEARCHING_DONORS' || selectedRequest.status === 'MATCHED') && (
                <WaveTimer
                  waveNumber={1}
                  currentRadiusKm={5}
                  nextRadiusKm={10}
                  initialSeconds={180}
                  onTimeout={() => {
                    handleSelectRequest(selectedRequest.id);
                  }}
                />
              )}

              {/* Anonymized Candidate Table (Zero-PII Contact Protected) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Stage 2 Anonymous Donor Candidates
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Wave 1 (5 km Radius) · Top 3 Capped
                  </span>
                </div>
                <CandidateTable
                  candidates={candidates}
                  onOpenRelay={candId => {
                    setRelayCandidateId(candId);
                    setIsRelayOpen(true);
                  }}
                  onOpenRoute={(candId, dist) => {
                    setRouteModalData({
                      isOpen: true,
                      candidateId: candId,
                      distanceKm: dist
                    });
                  }}
                />
              </div>

              {/* Live Event Timeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Request Execution Timeline (SSE Live)</span>
                </h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {events.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">No event records logged yet.</div>
                  ) : (
                    events.map((evt, idx) => (
                      <div key={evt.id || idx} className="flex items-start gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{evt.eventType}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{evt.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <MedicalDisclaimer compact />
            </>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs">
              Select an emergency request from the queue to view real-time matching and candidates.
            </div>
          )}
        </div>
      </div>

      {/* Hospital Transfusion Map */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>Regional Availability & Donor Density Map</span>
          <span className="text-xs text-slate-500 font-normal">
            (Centroid: Thrissur 680001 · 5 km & 10 km Search Waves)
          </span>
        </h3>
        <MapView
          center={[10.5276, 76.2144]}
          zoom={12}
          hospitals={hospitals}
          bloodBanks={bloodBanks}
          donorZones={donorZones}
          selectedRadiusKm={5}
        />
      </div>

      {/* Relay Modal */}
      {selectedRequest && isRelayOpen && (
        <RelayChatModal
          requestId={selectedRequest.id}
          candidateId={relayCandidateId || 'D-014'}
          userRole="HOSPITAL"
          isOpen={isRelayOpen}
          onClose={() => setIsRelayOpen(false)}
        />
      )}

      {/* Transit Route Simulator Modal */}
      {routeModalData?.isOpen && (
        <RouteSimulatorModal
          isOpen={routeModalData.isOpen}
          onClose={() => setRouteModalData(null)}
          candidateId={routeModalData.candidateId}
          distanceKm={routeModalData.distanceKm}
        />
      )}
    </div>
  );
};
