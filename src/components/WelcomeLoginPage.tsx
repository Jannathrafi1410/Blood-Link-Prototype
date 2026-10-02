import React, { useState } from 'react';
import { UserRole, User, BloodGroup } from '../types';
import { api } from '../services/api';
import { Mascot } from './Mascot';
import {
  Heart,
  Building2,
  Droplet,
  Users,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
  FileCheck2,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface WelcomeLoginPageProps {
  onLoginSuccess: (user: User) => void;
  onExploreGuestMap: () => void;
}

export const WelcomeLoginPage: React.FC<WelcomeLoginPageProps> = ({
  onLoginSuccess,
  onExploreGuestMap
}) => {
  const [activeTab, setActiveTab] = useState<'demo-personas' | 'register' | 'otp-signin'>('demo-personas');
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OTP Sign-in state
  const [identifier, setIdentifier] = useState('dr.thomas@abchospital.org');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpIssued, setIsOtpIssued] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(300);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  // Registration state
  const [regRole, setRegRole] = useState<UserRole>('DONOR');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPincode, setRegPincode] = useState('680001');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');
  const [regWeightKg, setRegWeightKg] = useState('65');
  const [regEntityName, setRegEntityName] = useState('');
  const [regLicenseNumber, setRegLicenseNumber] = useState('');
  const [regUnitCollege, setRegUnitCollege] = useState('');
  const [regConsentAccepted, setRegConsentAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  // 6 Demo Personas per Prompt Specification
  const personas = [
    {
      role: 'HOSPITAL' as UserRole,
      title: 'Hospital Administrator',
      personName: 'Dr. Thomas Mathew',
      entityName: 'ABC Hospital, Thrissur (Trauma Level 1)',
      badge: 'Clinical Triage Desk',
      description: 'Broadcasts emergency SOS requests, reviews compatibility-ranked candidate queues, and safely coordinates transfusion delivery.',
      syntheticNote: 'Active Request: BAN-10291 (2 units O- Whole Blood required)',
      icon: Building2,
      accentColor: 'border-red-200 hover:border-red-500 bg-white hover:bg-red-50/20'
    },
    {
      role: 'BLOOD_BANK' as UserRole,
      title: 'Blood Bank Administrator',
      personName: 'Priya Nair',
      entityName: 'Jubilee Mission Blood Centre',
      badge: 'Transfusion Lead',
      description: 'Tracks whole blood, plasma, and platelet inventory, monitors expiration freshness, and processes reservation dispatches.',
      syntheticNote: 'Inventory: 47 units across components, 0 units O- Whole Blood',
      icon: Droplet,
      accentColor: 'border-red-200 hover:border-red-500 bg-white hover:bg-red-50/20'
    },
    {
      role: 'NSS_PARTNER' as UserRole,
      title: 'NSS Campus User',
      personName: 'Prof. Haridas K.',
      entityName: 'St. Thomas College NSS Unit #42',
      badge: 'Program Coordinator',
      description: 'Organizes voluntary donation drives, maintains student volunteer rosters, and validates explicit donor consent audits.',
      syntheticNote: 'Roster: 142 student volunteers, next camp Oct 18, 2026',
      icon: Users,
      accentColor: 'border-amber-200 hover:border-amber-500 bg-white hover:bg-amber-50/20'
    },
    {
      role: 'DONOR' as UserRole,
      title: 'Voluntary Donor',
      personName: 'Rahul Varma',
      entityName: 'Candidate D-014 (Thrissur Centroid)',
      badge: 'Universal O- Negative',
      description: 'Receives zero-PII emergency notifications, manages emergency alert opt-in settings, updates health declarations, and views donation history.',
      syntheticNote: 'Status: 110 days since donation · Eligible for whole blood',
      icon: Heart,
      accentColor: 'border-emerald-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/20'
    },
    {
      role: 'PATIENT' as UserRole,
      title: 'Patient / Family Requester',
      personName: 'Lakshmi Menon',
      entityName: 'Emergency Caregiver for Patient',
      badge: 'Family Requester',
      description: 'Submits urgent requisition, tracks clinical hospital desk verification, and monitors bank-first matching without donor PII exposure.',
      syntheticNote: 'Active Requisition: BAN-10293 · B+ Red Cells',
      icon: Users,
      accentColor: 'border-blue-200 hover:border-blue-500 bg-white hover:bg-blue-50/20'
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Main Administrator',
      personName: 'System Administrator',
      entityName: 'Platform Audit & Governance',
      badge: 'Compliance & Audit',
      description: 'Audits immutable security logs, reviews masked user registries, monitors national fulfillment rates, and validates institutional licenses.',
      syntheticNote: 'Least-Privilege: All contact data masked with mandatory audit trail',
      icon: Settings,
      accentColor: 'border-purple-200 hover:border-purple-500 bg-white hover:bg-purple-50/20'
    }
  ];

  const handleDemoSignIn = async (role: UserRole) => {
    try {
      setLoadingRole(role);
      setError(null);
      const res = await api.login(undefined, role);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Demo sign-in failed. Please try again.');
    } finally {
      setLoadingRole(null);
    }
  };

  const handleRequestOtp = async () => {
    if (!identifier) {
      setError('Please provide an email address or registered telephone.');
      return;
    }
    setOtpLoading(true);
    setError(null);
    try {
      const res = await api.requestOtp(identifier, true);
      setIsOtpIssued(true);
      setSimulatedCode(res.simulatedDevOtp || '749210');
      setOtpCode(res.simulatedDevOtp || '749210'); // Pre-fill for ease of testing
    } catch (err: any) {
      setError(err.message || 'Failed to issue challenge.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtpAndLogin = async () => {
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }
    setOtpLoading(true);
    setError(null);
    try {
      await api.verifyOtp(identifier, otpCode);
      const res = await api.login(identifier);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
      setAttemptsLeft(prev => Math.max(0, prev - 1));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPincode) {
      setError('Name, email, and 6-digit Indian PIN code are mandatory.');
      return;
    }

    if (!regConsentAccepted) {
      setError('You must accept the informed platform participation & privacy consent.');
      return;
    }

    setRegLoading(true);
    setError(null);
    try {
      const res = await api.register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        pincode: regPincode,
        role: regRole,
        bloodGroup: regBloodGroup,
        weightKg: regWeightKg,
        entityName: regEntityName,
        licenseNumber: regLicenseNumber,
        unitCollege: regUnitCollege
      });

      setRegSuccessNotice(res.message);
      // Auto login newly registered user
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 selection:bg-red-500 selection:text-white">
      {/* Top Banner Notice */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-2 text-xs flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Healthcare Coordination Prototype:</strong> Simulated OTP verification, test encryption keys, and indicative eligibility declarations are active for demonstration. Not medical advice or legal identification.
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Brand & Hero Introduction */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="w-20 h-20 mx-auto">
            <Mascot size="lg" mood="happy" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            BLOOD AVAILABILITY NETWORK
          </h1>
          <p className="text-sm sm:text-base text-red-600 font-bold uppercase tracking-wider">
            The right blood, to the right patient, at the right time.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            An intelligent, privacy-preserving healthcare coordination platform connecting hospitals, blood banks, voluntary donors, and NSS student chapters during critical medical shortages. Featuring zero-PII candidate matching, bank-first reservations, and coarse location masking.
          </p>

          {/* Quick Guest Explorer Pill */}
          <div className="pt-2">
            <button
              onClick={onExploreGuestMap}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>Explore Public Pincode Registry & Compatibility Matrix (No Sign-In Required)</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="max-w-xl mx-auto mb-6 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notice */}
        {regSuccessNotice && (
          <div className="max-w-xl mx-auto mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{regSuccessNotice} Signing you into your dashboard...</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold max-w-lg w-full">
            <button
              onClick={() => {
                setActiveTab('demo-personas');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === 'demo-personas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Sign-In (6 Roles)
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Account
            </button>
            <button
              onClick={() => {
                setActiveTab('otp-signin');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === 'otp-signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulated OTP Sign-In
            </button>
          </div>
        </div>

        {/* TAB 1: 6 DEMO PERSONAS */}
        {activeTab === 'demo-personas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Choose a Demo Role to Enter Live Simulation</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Realistic, clearly marked synthetic dataset pre-loaded for each clinical stakeholder.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                Zero Configuration Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {personas.map(p => {
                const Icon = p.icon;
                const isLoading = loadingRole === p.role;
                return (
                  <div
                    key={p.role}
                    className={`border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${p.accentColor}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {p.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                        <div className="text-xs font-semibold text-red-700">{p.personName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{p.entityName}</div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="p-2.5 bg-slate-100/70 rounded-xl border border-slate-200/60 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">Synthetic Scenario: </span>
                        {p.syntheticNote}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleDemoSignIn(p.role)}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 hover:gap-2 disabled:opacity-50"
                      >
                        <span>{isLoading ? 'Authenticating...' : `Demo Sign-In as ${p.title}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER NEW ACCOUNT */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Register New Stakeholder Account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Role-specific onboarding with verified credentialing. Privileged healthcare roles (Hospital, Blood Bank, NSS) require verified licensing.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Your Network Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'DONOR', label: 'Voluntary Donor' },
                    { id: 'PATIENT', label: 'Patient / Family' },
                    { id: 'HOSPITAL', label: 'Hospital Admin' },
                    { id: 'BLOOD_BANK', label: 'Blood Bank Admin' },
                    { id: 'NSS_PARTNER', label: 'NSS Chapter' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegRole(r.id as UserRole)}
                      className={`p-2.5 rounded-xl border font-semibold text-center transition-all ${
                        regRole === r.id
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Kavitha Menon"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="kavitha@example.org"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (Encrypted at Rest)
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+91 98470 12345"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Indian Pincode (6 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={regPincode}
                    onChange={e => setRegPincode(e.target.value)}
                    placeholder="680001"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {regRole === 'DONOR' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="font-bold text-xs text-slate-900">Donor Specific Information</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Blood Group *
                      </label>
                      <select
                        value={regBloodGroup}
                        onChange={e => setRegBloodGroup(e.target.value as BloodGroup)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Weight (kg) *
                      </label>
                      <input
                        type="number"
                        min="35"
                        max="180"
                        value={regWeightKg}
                        onChange={e => setRegWeightKg(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Your exact address is never stored. Location is masked to a ~1 km coarse grid centroid.
                  </div>
                </div>
              )}

              {(regRole === 'HOSPITAL' || regRole === 'BLOOD_BANK') && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Institutional Credentialing & License</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Facility Entity Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regEntityName}
                        onChange={e => setRegEntityName(e.target.value)}
                        placeholder="e.g. Westside Trauma Care"
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        State Health / Drug License No. *
                      </label>
                      <input
                        type="text"
                        required
                        value={regLicenseNumber}
                        onChange={e => setRegLicenseNumber(e.target.value)}
                        placeholder="KER-MED-2026-9021"
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Notice: Privileged accounts start with <span className="font-bold">PENDING verification</span> status until approved by administrators to protect patient safety.
                  </div>
                </div>
              )}

              {regRole === 'NSS_PARTNER' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-slate-900">NSS Unit Affiliation</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      College / Institution Name & Unit #
                    </label>
                    <input
                      type="text"
                      required
                      value={regUnitCollege}
                      onChange={e => setRegUnitCollege(e.target.value)}
                      placeholder="e.g. Govt Victoria College NSS Unit #18"
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Consent Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regConsentAccepted}
                    onChange={e => setRegConsentAccepted(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 mt-0.5"
                  />
                  <span className="text-xs text-slate-700">
                    I give informed consent to participate in this voluntary healthcare coordination network. I understand that my location is masked to coarse coordinates and that direct contact details are never disclosed to other users.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{regLoading ? 'Registering Account...' : 'Submit Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SIMULATED OTP SIGN-IN */}
        {activeTab === 'otp-signin' && (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Simulated OTP Sign-In</h2>
              <p className="text-xs text-slate-500">
                Test the rate-limited, hashed challenge authentication boundary.
              </p>
            </div>

            {/* Test Helper Notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Simulated Dev OTP Mode Active</span>
              </div>
              <p className="text-[11px] text-amber-800">
                In this demo environment, test code <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded">749210</strong> is generated. In production, this boundary delegates to an authorized provider (e.g. DigiLocker / Aadhaar eKYC) without storing credentials.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address or Phone
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="dr.thomas@abchospital.org"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {!isOtpIssued ? (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpLoading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {otpLoading ? 'Issuing OTP Challenge...' : 'Request Verification OTP'}
                </button>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Enter 6-Digit Code
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Expires in 5:00 ({attemptsLeft} attempts left)
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="749210"
                      className="w-full text-center tracking-widest font-mono text-base p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtpAndLogin}
                    disabled={otpLoading}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{otpLoading ? 'Verifying...' : 'Verify OTP & Enter'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                    >
                      Resend Challenge OTP (30s cooldown)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-xs border-t border-slate-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Donor Contact Exposure · AES-256-GCM Encrypted at Rest · TLS Transport</span>
          </div>
          <div>
            Blood Availability Network &copy; {new Date().getFullYear()} · Clinical Healthcare Logistics
          </div>
        </div>
      </footer>
    </div>
  );
};
