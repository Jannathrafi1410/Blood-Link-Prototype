import React from 'react';
import { DonorProfile } from '../types';
import { ShieldCheck, Heart, QrCode, Award, CheckCircle2, Calendar } from 'lucide-react';

export const DonorDigitalPass: React.FC<{ profile: DonorProfile; className?: string }> = ({
  profile,
  className = ''
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/80 ${className}`}
    >
      {/* Background Decorative Crest */}
      <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-red-600/10 blur-2xl pointer-events-none" />
      <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
        <Heart className="w-32 h-32 text-red-500 fill-red-500" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-md border border-red-400/40">
            {profile.bloodGroup}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-400">
              National Blood Donor Pass
            </div>
            <h3 className="text-lg font-extrabold text-white">Rahul Varma</h3>
            <div className="text-xs text-slate-400 font-mono">
              Anonymous Code: <strong className="text-emerald-400 font-mono">{profile.candidateCode}</strong>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Eligible & Active</span>
          </span>
        </div>
      </div>

      {/* Center Details & Simulated Check-In QR */}
      <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
        <div className="sm:col-span-8 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Area Centroid:</span>
            <span className="font-semibold text-white">PIN {profile.pincode} (Thrissur)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Cooldown Interval:</span>
            <span className="font-semibold text-emerald-400">110 Days (Target: 90d Satisfied)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Donations Completed:</span>
            <span className="font-bold text-white">{profile.donationCount || 4} Lives Impacted</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Reliability Response:</span>
            <span className="font-bold text-amber-400">{Math.round((profile.responseRate || 0.95) * 100)}% Match Record</span>
          </div>
        </div>

        {/* QR Code Graphic for Transfusion Reception Check-In */}
        <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-white rounded-xl text-slate-950 shadow-inner">
          <svg viewBox="0 0 100 100" className="w-20 h-20">
            {/* Clean SVG QR Code pattern */}
            <rect x="0" y="0" width="30" height="30" fill="#0F172A" />
            <rect x="5" y="5" width="20" height="20" fill="#FFFFFF" />
            <rect x="10" y="10" width="10" height="10" fill="#0F172A" />

            <rect x="70" y="0" width="30" height="30" fill="#0F172A" />
            <rect x="75" y="5" width="20" height="20" fill="#FFFFFF" />
            <rect x="80" y="10" width="10" height="10" fill="#0F172A" />

            <rect x="0" y="70" width="30" height="30" fill="#0F172A" />
            <rect x="5" y="75" width="20" height="20" fill="#FFFFFF" />
            <rect x="10" y="80" width="10" height="10" fill="#0F172A" />

            {/* Random Matrix bits */}
            <rect x="40" y="10" width="10" height="10" fill="#0F172A" />
            <rect x="55" y="20" width="10" height="10" fill="#0F172A" />
            <rect x="40" y="40" width="20" height="20" fill="#DC2626" />
            <rect x="70" y="45" width="10" height="10" fill="#0F172A" />
            <rect x="85" y="60" width="10" height="10" fill="#0F172A" />
            <rect x="35" y="70" width="10" height="10" fill="#0F172A" />
            <rect x="50" y="80" width="15" height="10" fill="#0F172A" />
            <rect x="75" y="80" width="15" height="15" fill="#0F172A" />
          </svg>
          <span className="text-[9px] font-mono font-bold text-slate-800 mt-1">
            CHECK-IN QR
          </span>
        </div>
      </div>

      {/* Footer Security Note */}
      <div className="relative z-10 mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>No PII or telephone data stored inside QR tag</span>
        </span>
        <span className="font-mono text-slate-500">ID: BAN-D014-KL</span>
      </div>
    </div>
  );
};
