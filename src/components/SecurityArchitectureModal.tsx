import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  KeyRound,
  FileCheck2,
  AlertTriangle,
  X,
  CheckCircle2,
  Layers,
  Database
} from 'lucide-react';
import { UserRole } from '../types';

interface SecurityArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: UserRole;
}

export const SecurityArchitectureModal: React.FC<SecurityArchitectureModalProps> = ({
  isOpen,
  onClose,
  currentUserRole
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'encryption' | 'identity' | 'audit'>('matrix');

  if (!isOpen) return null;

  const roleBoundaries = [
    {
      role: 'Hospital Administrator',
      allowed: ['Own facility patient requests', 'Candidate IDs (e.g. D-014)', 'Approximate distance (~2.1 km)', 'Coordinated relay messages'],
      denied: ['Donor personal telephone numbers', 'Donor email & street addresses', 'Other hospitals\' private requests', 'Other blood banks\' internal inventory'],
      privacyControl: 'Pseudonymous candidate codes & coarse 1 km grid jitter.'
    },
    {
      role: 'Blood Bank Administrator',
      allowed: ['Own bank component inventory (RBCs, Platelets, Plasma)', 'Linked emergency reservation requests', 'Bulk CSV stock imports'],
      denied: ['Other blood banks\' inventory or reservations', 'Donor personal medical history', 'Unrelated patient hospital records'],
      privacyControl: 'Facility ID boundary enforced at API controller level.'
    },
    {
      role: 'NSS Campus User',
      allowed: ['Own institution camps & schedules', 'Consented volunteer roster counts', 'Explicitly consented donor import'],
      denied: ['Clinical hospital emergency requests', 'Individual patient charts', 'Donor personal contact details'],
      privacyControl: 'Institutional unit isolation & mandatory consent validation.'
    },
    {
      role: 'Voluntary Donor',
      allowed: ['Own profile & health declarations', 'Own donation history milestones', 'Emergency alerts addressed to them', 'Notification preferences & opt-in toggles'],
      denied: ['Hospital administrative console', 'Other donors\' private profiles', 'Blood bank inventory management', 'Patient identity or billing data'],
      privacyControl: 'Zero PII exposure; candidate receives only hospital facility & approximate area.'
    },
    {
      role: 'Patient / Family',
      allowed: ['Own emergency requisition status', 'Verified hospital clinical desk contact', 'Nearest blood bank stock radar'],
      denied: ['Donor candidate personal details', 'Internal hospital triage queue of other patients'],
      privacyControl: 'Purely operational visibility; zero direct contact with voluntary donors.'
    },
    {
      role: 'Main Administrator',
      allowed: ['Masked user overview (ra***@donormail.net)', 'Aggregated national metrics & availability', 'Tamper-evident immutable audit logs', 'System matching settings'],
      denied: ['Plaintext donor PII by default', 'Raw medical questionnaires without explicit logged clinical justification'],
      privacyControl: 'Least-privilege default masking; emergency unmasking requires justification and creates immutable audit events.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Privacy, Cryptography & Access Architecture</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero Trust Healthcare Spec
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Technical overview of role separation, authenticated encryption, identity boundaries, and immutable audit logs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Role-Based Access Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('encryption')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'encryption'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Encryption at Rest & In-Transit</span>
          </button>
          <button
            onClick={() => setActiveTab('identity')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'identity'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Identity Checks & OTP Boundary</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Immutable Audit Logging</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-3">
                <EyeOff className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-slate-700">
                  <span className="font-bold text-slate-900">Principle of Least Privilege (PoLP): </span>
                  Every stakeholder role has strictly segregated read/write scopes. Hiding buttons in the UI is never treated as authorization; all boundaries are enforced on the server for direct API requests.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleBoundaries.map((rb, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{rb.role}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        Isolated Scope
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                          ✓ Permitted Operational Access
                        </span>
                        <ul className="space-y-1">
                          {rb.allowed.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
                          ✗ Strictly Prohibited & Blocked
                        </span>
                        <ul className="space-y-1">
                          {rb.denied.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <strong>Privacy Mechanism:</strong> {rb.privacyControl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'encryption' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Database className="w-4 h-4" />
                  <span>Authenticated Encryption at Rest: AES-256-GCM</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  All personally identifiable donor data (telephone numbers, full email addresses, and self-reported health declarations) are encrypted at rest using authenticated AES-256-GCM. Decryption is isolated to server-side services with explicit need-to-know access. Decryption keys are decoupled from database storage and managed via external Key Management Services (AWS KMS, GCP Cloud KMS, or HashiCorp Vault in deployment).
                </p>
                <div className="p-2.5 bg-slate-950 font-mono text-[11px] text-emerald-300 rounded-lg overflow-x-auto">
                  Payload Format: iv_hex[12-bytes] : auth_tag_hex[16-bytes] : ciphertext_hex
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-blue-600" />
                    <span>Transport Layer Security (TLS)</span>
                  </h4>
                  <p className="text-slate-600 text-xs">
                    All client-server communications are served over HTTPS/TLS with strict transport security (HSTS), nosniff content headers, and restrictive frame options.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-amber-600" />
                    <span>In-App Relay Sanitization Engine</span>
                  </h4>
                  <p className="text-slate-600 text-xs">
                    All in-app messages between hospital desks and matched donors pass through automated regular expression filters that intercept telephone numbers, email addresses, and street addresses, rejecting direct contact leakage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Clearly Labeled Demo Simulation vs Production Provider Boundary</span>
                </div>
                <p className="text-amber-800 text-xs leading-relaxed">
                  In this demonstration prototype, identity verification utilizes a labeled <strong>Simulated OTP mode</strong> (Test Code: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">749210</code>). It is strictly designated for development and evaluation and does not claim to verify real-world legal identities.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Production Identity Provider Boundary Architecture</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  For production deployment, the platform implements a clean provider abstraction boundary (<code className="font-mono text-slate-800">IdentityVerificationProvider</code>) designed to interface with authorized identity services such as <strong>DigiLocker / Aadhaar eKYC</strong>, subject to regulatory compliance and user consent:
                </p>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <span><strong>User Directed Consent:</strong> User is redirected to the authorized identity gateway with explicit scope transparency.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <span><strong>Data Minimization:</strong> The platform stores solely the minimum verification result, a cryptographic transaction reference (<code className="font-mono text-[10px]">providerReferenceId</code>), and timestamp. Zero national identity documents or raw credentials are retained.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <span><strong>Rate Limiting & Security Controls:</strong> OTP challenges feature 5-minute expiry, maximum 3-attempt invalidation, and 30-second cooldown rate limiting with SHA-256 hashed secret comparison.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Tamper-Evident Immutable Audit Service</span>
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Every state mutation and privileged access event generates an immutable audit record containing the authenticated user ID, role, action category, affected resource, and timestamp.
                </p>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200">
                    Audit Logging Coverage
                  </div>
                  <div className="p-3 space-y-2 text-slate-700">
                    <div>• <strong>USER_LOGIN & LOGOUT:</strong> Session generation and lifecycle tracking.</div>
                    <div>• <strong>PII_UNMASKED_AUDIT:</strong> Mandatory clinical justification recorded when administrator unmasks records.</div>
                    <div>• <strong>ALERTS_CONSENT_UPDATED:</strong> Timestamped records of donor opt-in / opt-out changes.</div>
                    <div>• <strong>HEALTH_DETAILS_UPDATED:</strong> Changes to self-reported fitness indicators.</div>
                    <div>• <strong>PII_RELAY_BLOCKED:</strong> Automated interception of prohibited telephone or address patterns in messaging.</div>
                    <div>• <strong>ACCESS_DENIED_RBAC:</strong> Security alerts triggered when an unpermitted role attempts endpoint traversal.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Demonstration Environment · Synthetic Healthcare Records</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
