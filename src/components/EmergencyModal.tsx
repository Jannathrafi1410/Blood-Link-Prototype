import React, { useState } from 'react';
import { BloodGroup, BloodComponent, UrgencyLevel, UserRole, EmergencyRequest } from '../types';
import { api } from '../services/api';
import { Mascot } from './Mascot';
import { MedicalDisclaimer } from './MedicalDisclaimer';
import { X, AlertCircle, CheckCircle2, Siren, ArrowRight, Building2, MapPin } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: UserRole;
  onRequestCreated: (req: EmergencyRequest) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'HOSPITAL',
  onRequestCreated
}) => {
  const [step, setStep] = useState<'form' | 'confirmed'>('form');
  const [pincode, setPincode] = useState('680001');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [component, setComponent] = useState<BloodComponent>('Whole Blood');
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [hospitalName, setHospitalName] = useState('ABC Hospital, Thrissur');
  const [patientRef, setPatientRef] = useState('PT-TH-99402');
  const [notes, setNotes] = useState('Immediate transfusion required for emergency cardiac case.');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<EmergencyRequest | null>(null);
  const [matchingResult, setMatchingResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.createEmergencyRequest({
        bloodGroup,
        component,
        units,
        urgency,
        pincode,
        hospitalName,
        patientReferenceId: patientRef,
        notes,
        requesterRole: currentUserRole
      });

      setCreatedRequest(res.request);
      setMatchingResult(res.matching);
      onRequestCreated(res.request);
      setStep('confirmed');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create emergency request.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setCreatedRequest(null);
    setMatchingResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-700/80 rounded-xl">
              <Siren className="w-6 h-6 animate-pulse text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Create Emergency Blood SOS</h2>
              <p className="text-xs text-red-100">
                Centralized bank-first search & privacy-safe donor matching
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-red-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Demo Pre-fill banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600">
                <strong>Benchmark Scenario:</strong> Thrissur O- Whole Blood (2 units, Critical)
              </span>
              <button
                type="button"
                onClick={() => {
                  setPincode('680001');
                  setBloodGroup('O-');
                  setComponent('Whole Blood');
                  setUnits(2);
                  setUrgency('CRITICAL');
                  setHospitalName('ABC Hospital, Thrissur');
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
              >
                Reset Pre-fill
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Blood Group *
                </label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500 font-bold text-red-600"
                >
                  <option value="O-">O Negative (O−)</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="A-">A Negative (A−)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="B-">B Negative (B−)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="AB-">AB Negative (AB−)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                </select>
              </div>

              {/* Component */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Component *
                </label>
                <select
                  value={component}
                  onChange={e => setComponent(e.target.value as BloodComponent)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500"
                >
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="Red Cells">Packed Red Cells (RBC)</option>
                  <option value="Platelets">Platelets / RDP</option>
                  <option value="Plasma">Fresh Frozen Plasma (FFP)</option>
                </select>
              </div>

              {/* Units Requested */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units Needed *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={units}
                  onChange={e => setUnits(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Level *
                </label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500 font-semibold"
                >
                  <option value="CRITICAL">CRITICAL (Immediate OT / Trauma)</option>
                  <option value="HIGH">HIGH (Within 4-6 hours)</option>
                  <option value="MODERATE">MODERATE (Scheduled surgery)</option>
                </select>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location PIN Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={e => setPincode(e.target.value.trim())}
                    placeholder="e.g. 680001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500 pl-8 font-mono"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Hospital Facility */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital / Destination
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500 pl-8"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Context / Notes (Protected: PII auto-filtered)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Brief medical context. Personal phone numbers or home addresses will be automatically blocked."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500"
              />
            </div>

            <MedicalDisclaimer compact />

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>{loading ? 'Validating & Dispatching...' : 'Broadcast Emergency SOS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Screen (Section 31 requirement) */
          <div className="p-6 space-y-5 text-center">
            <div className="flex justify-center">
              <Mascot size="lg" mood="proud" speechBubble="Emergency broadcast initiated!" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Request Dispatched to Network</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-mono">
                {createdRequest?.id}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {createdRequest?.hospitalName} · PIN {createdRequest?.pincode}
              </p>
            </div>

            {/* Live Matching Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between font-semibold text-slate-900 pb-2 border-b border-slate-200">
                <span>Matching Engine Status:</span>
                <span className="text-red-600 font-bold">{createdRequest?.status}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bank-First Reservation:</span>
                <span>{matchingResult?.reservedUnits || 0} units reserved</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Donor Wave Dispatched:</span>
                <span>{matchingResult?.candidateCount || 0} candidates notified (5 km)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verification State:</span>
                <span className="text-emerald-700 font-semibold">{createdRequest?.verificationState}</span>
              </div>
            </div>

            {/* Patient Request Notice if UNVERIFIED (Section 12 requirement) */}
            {createdRequest?.verificationState === 'UNVERIFIED' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
                <strong>Family Notice:</strong> Blood bank inventory search has commenced. Immediate donor SOS notification is pending verification by ABC Hospital or an administrator to protect community safety.
              </div>
            )}

            <MedicalDisclaimer compact />

            <div className="pt-2">
              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
              >
                Open Emergency Tracking Console
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
