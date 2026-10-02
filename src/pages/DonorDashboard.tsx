import React, { useState, useEffect } from 'react';
import { DonorProfile, DonorNotification } from '../types';
import { api } from '../services/api';
import { Mascot } from '../components/Mascot';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { RelayChatModal } from '../components/RelayChatModal';
import { DonorDigitalPass } from '../components/DonorDigitalPass';
import {
  Heart,
  ShieldCheck,
  Bell,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  MessageSquare,
  Activity,
  Calendar,
  Scale,
  Edit3,
  X,
  Check,
  FileText,
  Info
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [notifications, setNotifications] = useState<DonorNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [relayRequestId, setRelayRequestId] = useState<string | null>(null);
  const [isRelayOpen, setIsRelayOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Health modal state
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [weightKgInput, setWeightKgInput] = useState<string>('68');
  const [recentIllnessInput, setRecentIllnessInput] = useState(false);
  const [recentMedicationInput, setRecentMedicationInput] = useState(false);
  const [recentTravelInput, setRecentTravelInput] = useState(false);
  const [selfReportedFitInput, setSelfReportedFitInput] = useState(true);
  const [healthNotesInput, setHealthNotesInput] = useState('');
  const [savingHealth, setSavingHealth] = useState(false);

  // Consent updating state
  const [updatingAlertsConsent, setUpdatingAlertsConsent] = useState(false);

  const loadDonorData = async () => {
    try {
      setLoading(true);
      const userRes = await api.getMe();
      if (userRes.donor) {
        setProfile(userRes.donor);
        setWeightKgInput(userRes.donor.healthDetails?.weightKg?.toString() || '68');
        setRecentIllnessInput(userRes.donor.healthDetails?.recentIllness || false);
        setRecentMedicationInput(userRes.donor.healthDetails?.recentMedication || false);
        setRecentTravelInput(userRes.donor.healthDetails?.recentTravel || false);
        setSelfReportedFitInput(userRes.donor.healthDetails?.selfReportedFit ?? true);
        setHealthNotesInput(userRes.donor.healthDetails?.notes || '');

        const notifs = await api.getNotifications(userRes.donor.candidateCode);
        setNotifications(notifs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonorData();
  }, []);

  // 1. Toggle Operational Availability
  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const res = await api.toggleAvailability(profile.candidateCode, !profile.isAvailable);
      if (res.success) {
        setProfile(res.donor);
        setSuccessMessage(`Operational readiness switched to: ${res.donor.isAvailable ? 'AVAILABLE' : 'PAUSED'}.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update availability.');
    }
  };

  // 2. Toggle Emergency Alerts Consent Opt-in/Opt-out (Section 3 Requirement)
  const handleToggleAlertsConsent = async () => {
    if (!profile) return;
    setUpdatingAlertsConsent(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const newConsent = !profile.emergencyAlertsOptIn;
    try {
      const res = await api.updateDonorAlertsConsent(newConsent);
      if (res.success) {
        setProfile(res.donor);
        setSuccessMessage(
          newConsent
            ? 'Emergency donation alerts resumed. You will be notified when critical matching requests occur.'
            : 'Emergency donation alerts paused. You will not receive broadcast SOS notifications until resumed. Account remains active.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update alert consent.');
    } finally {
      setUpdatingAlertsConsent(false);
    }
  };

  // 3. Update Health Declaration
  const handleSaveHealthDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightKgInput);
    if (isNaN(w) || w < 35 || w > 200) {
      setErrorMessage('Please enter a valid weight in kilograms (35 - 200 kg).');
      return;
    }

    setSavingHealth(true);
    setErrorMessage(null);
    try {
      const res = await api.updateDonorHealth({
        weightKg: w,
        recentIllness: recentIllnessInput,
        recentMedication: recentMedicationInput,
        recentTravel: recentTravelInput,
        selfReportedFit: selfReportedFitInput,
        notes: healthNotesInput
      });
      if (res.success) {
        setProfile(res.donor);
        setIsHealthModalOpen(false);
        setSuccessMessage('Self-reported health declaration updated successfully. Stored encrypted at rest.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save health declaration.');
    } finally {
      setSavingHealth(false);
    }
  };

  const handleAcceptSos = async (notifId: string, requestId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.acceptSos(notifId, profile?.candidateCode || 'D-014');
      setSuccessMessage(
        `Match Confirmed! Request ${requestId} linked. Your personal telephone number & home address remain completely protected.`
      );
      setRelayRequestId(requestId);
      setIsRelayOpen(true);
      loadDonorData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept SOS.');
    }
  };

  const handleDeclineSos = async (notifId: string) => {
    try {
      await api.declineSos(notifId, profile?.candidateCode || 'D-014');
      loadDonorData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to decline SOS.');
    }
  };

  // Format dates
  const lastDonationFormatted = profile?.lastDonationDate
    ? new Date(profile.lastDonationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'June 14, 2026';

  const nextEligibleFormatted = profile?.nextEligibleDonationDate
    ? new Date(profile.nextEligibleDonationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'September 12, 2026';

  const consentTimestampFormatted = profile?.alertsConsentUpdatedAt
    ? new Date(profile.alertsConsentUpdatedAt).toLocaleString()
    : 'Recorded on file';

  const healthLastReportedFormatted = profile?.healthDetails?.lastReportedAt
    ? new Date(profile.healthDetails.lastReportedAt).toLocaleDateString()
    : '2026-09-15';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Summary Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Heart className="w-8 h-8 fill-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Rahul Varma <span className="font-mono text-sm text-slate-500">({profile?.candidateCode || 'D-014'})</span>
              </h1>
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                Group {profile?.bloodGroup || 'O-'} Universal
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Voluntary Donor</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Centroid: PIN {profile?.pincode || '680001'} (Thrissur, Kerala) · 1 km Coarse Grid Masking</span>
            </p>
          </div>
        </div>

        {/* Dual Control Toggles: 1) Availability 2) Alerts Consent */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Toggle A: Operational Availability */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900">Readiness State</div>
              <div className="text-[10px] text-slate-500">
                {profile?.isAvailable ? 'Active for triage' : 'Temporarily paused'}
              </div>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                profile?.isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-300 hover:bg-slate-400 text-slate-800'
              }`}
            >
              {profile?.isAvailable ? 'AVAILABLE' : 'PAUSED'}
            </button>
          </div>

          {/* Toggle B: Emergency Alert Opt-In Consent (Section 3 Requirement) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Bell className="w-3 h-3 text-red-500" />
                <span>Emergency SOS Alerts</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {profile?.emergencyAlertsOptIn !== false
                  ? 'Opted In to Broadcasts'
                  : 'Alerts Paused by Donor'}
              </div>
            </div>
            <button
              onClick={handleToggleAlertsConsent}
              disabled={updatingAlertsConsent}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                profile?.emergencyAlertsOptIn !== false
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-slate-300 hover:bg-slate-400 text-slate-800'
              }`}
            >
              {profile?.emergencyAlertsOptIn !== false ? 'OPTED IN' : 'OPTED OUT'}
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Alert Consent Transparency Notice */}
      <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Emergency Alert Notification Setting: </span>
            {profile?.emergencyAlertsOptIn !== false ? (
              <span>
                You have opted in to receive emergency donation alerts, including high-urgency requisitions from verified local hospitals. Opting out will immediately pause these broadcast notifications while keeping your profile and donation history intact. You may change this preference at any time.
              </span>
            ) : (
              <span className="text-amber-800 font-semibold">
                You have paused emergency donation alerts. The matching engine will not notify you for hospital broadcasts until you resume.
              </span>
            )}
            <div className="text-[11px] text-slate-500 mt-0.5">
              Consent State Timestamp: <strong>{consentTimestampFormatted}</strong> (Logged in audit trail)
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleAlertsConsent}
          className="shrink-0 text-xs font-bold text-slate-800 underline hover:text-red-600"
        >
          {profile?.emergencyAlertsOptIn !== false ? 'Opt Out of Alerts' : 'Opt In to Alerts'}
        </button>
      </div>

      {/* Messages / Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 text-[11px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: SOS Notifications (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Emergency SOS Notifications ({notifications.length})</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Response Timeout: 180s</span>
          </div>

          {profile?.emergencyAlertsOptIn === false && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Emergency donation alerts are currently paused in your preferences. You will not receive incoming hospital SOS waves.
              </span>
            </div>
          )}

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
                <Mascot size="md" speechBubble="No active SOS in your area right now!" />
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are registered and verified. When a compatible hospital or patient in Thrissur creates a critical requisition, your wave will alert you here.
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const isAccepted = notif.status === 'ACCEPTED';
                const isDeclined = notif.status === 'DECLINED';
                const isPending = notif.status === 'PENDING';

                return (
                  <div
                    key={notif.id}
                    className={`bg-white border rounded-3xl p-5 shadow-xs transition-all ${
                      isAccepted
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                        : isDeclined
                        ? 'border-slate-200 opacity-60'
                        : 'border-red-300 ring-2 ring-red-500/20 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-red-600 animate-ping inline-block" />
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-500">
                            REQUISITION {notif.requestId}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">
                            {notif.units} Units {notif.bloodGroup} {notif.component}
                          </h3>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                        {notif.urgency}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700">
                      <div>
                        <strong>Hospital Facility:</strong> {notif.hospitalName}
                      </div>
                      <div>
                        <strong>Approximate Area:</strong> {notif.approxArea}
                      </div>
                      <div className="text-slate-500 text-[11px] pt-1">
                        Dispatch Time: {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleDeclineSos(notif.id)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                          >
                            Cannot Attend (Decline)
                          </button>
                          <button
                            onClick={() => handleAcceptSos(notif.id, notif.requestId)}
                            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ACCEPT SOS & MATCH</span>
                          </button>
                        </>
                      ) : isAccepted ? (
                        <div className="w-full flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Match Confirmed · Ready for Transfusion Center</span>
                          </span>
                          <button
                            onClick={() => {
                              setRelayRequestId(notif.requestId);
                              setIsRelayOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Coordinate via Relay</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          Declined · Network escalated to candidate in queue.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Physical Metrics, Cooldown & Donation History (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Donor Pass */}
          {profile && <DonorDigitalPass profile={profile} />}

          {/* Indicative Physical Health & Eligibility (Section 3 Requirement) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Self-Reported Health Indicators</span>
              </h3>
              <button
                onClick={() => setIsHealthModalOpen(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Update</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-800 font-semibold">Self-Reported Weight</span>
                </div>
                <span className="font-bold text-slate-900">
                  {profile?.healthDetails?.weightKg || 68} kg
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-slate-800 font-semibold">Last Donation Date</span>
                    <div className="text-[10px] text-slate-500">Whole Blood (1 Unit)</div>
                  </div>
                </div>
                <span className="font-bold text-slate-900">{lastDonationFormatted}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div>
                  <span className="text-slate-800 font-semibold">Next Eligible Donation Date</span>
                  <div className="text-[10px] text-emerald-700">90-Day Whole Blood Cooldown Rule</div>
                </div>
                <span className="font-bold text-emerald-700">{nextEligibleFormatted}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Health Self-Declaration Status:</span>
                  <span className="text-emerald-700 font-bold">Clear (Fit) ✓</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Last Updated: {healthLastReportedFormatted} · No recent illness or medication reported.
                </div>
              </div>
            </div>

            {/* Clear Medical Disclaimer Notice (Section 3 Requirement) */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Indicative Self-Report Only:</strong> This declaration does NOT constitute medical advice or official clinical clearance. Official eligibility and physical fitness are screened confidential on-site by qualified transfusion clinicians before blood collection.
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <PrivacyNotice />

          {/* Personal Donation Milestones (Section 3 Requirement) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Your Donation History ({profile?.donationCount || 4} Milestones)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Strictly Private to You</span>
            </div>
            <p className="text-xs text-slate-500">
              Hospitals and patients never view your donation timeline; only your pseudonymous Candidate ID ({profile?.candidateCode || 'D-014'}) is referenced.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-900">Jubilee Mission Blood Centre</div>
                  <div className="text-[11px] text-slate-500">Whole Blood (1 Unit · 350 ml) · Thrissur</div>
                </div>
                <span className="text-slate-600 font-medium">June 14, 2026</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-900">St. Thomas NSS Blood Donation Camp</div>
                  <div className="text-[11px] text-slate-500">Whole Blood (1 Unit) · College Auditorium</div>
                </div>
                <span className="text-slate-600 font-medium">January 20, 2026</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-900">District General Hospital Blood Bank</div>
                  <div className="text-[11px] text-slate-500">Whole Blood (1 Unit) · Thrissur</div>
                </div>
                <span className="text-slate-600 font-medium">September 10, 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Self-Reported Health Update Modal (Section 3 Requirement) */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">Update Self-Reported Health Declaration</h3>
              </div>
              <button
                onClick={() => setIsHealthModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed">
              Why we request this information: To assess indicative suitability before dispatching life-critical emergency alerts and avoid unnecessary travel. Data is minimized and stored encrypted at rest.
            </div>

            <form onSubmit={handleSaveHealthDeclaration} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Weight (in kilograms) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="35"
                    max="200"
                    step="0.5"
                    required
                    value={weightKgInput}
                    onChange={e => setWeightKgInput(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">kg</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Required: Minimum 45 kg for 350 ml Whole Blood collection.
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={recentIllnessInput}
                    onChange={e => setRecentIllnessInput(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span>Recent fever, infection, or antibiotic course in past 14 days</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={recentMedicationInput}
                    onChange={e => setRecentMedicationInput(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span>Currently taking prescription blood thinners or contraindicating drugs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={recentTravelInput}
                    onChange={e => setRecentTravelInput(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span>Recent international travel or stay in malaria-endemic zones</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={selfReportedFitInput}
                    onChange={e => setSelfReportedFitInput(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-emerald-900">
                    I declare that I feel in good health today and willing to be evaluated
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={healthNotesInput}
                  onChange={e => setHealthNotesInput(e.target.value)}
                  placeholder="e.g. Recently completed routine medical check-up."
                  rows={2}
                  maxLength={300}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                Notice: Information provided is purely indicative and does not constitute medical certification.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHealthModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingHealth}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {savingHealth ? 'Saving Declaration...' : 'Save & Encrypt Declaration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Relay Modal */}
      {isRelayOpen && relayRequestId && (
        <RelayChatModal
          requestId={relayRequestId}
          candidateId={profile?.candidateCode || 'D-014'}
          userRole="DONOR"
          isOpen={isRelayOpen}
          onClose={() => setIsRelayOpen(false)}
        />
      )}
    </div>
  );
};
