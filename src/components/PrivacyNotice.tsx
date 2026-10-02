import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyNotice: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 ${className}`}>
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-900 uppercase tracking-wider text-[11px]">
            Privacy-First Architecture (Zero Contact Unmasking)
          </p>
          <p className="leading-relaxed text-emerald-800">
            Donor telephone numbers, emails, and home addresses are cryptographically protected and never revealed to hospitals, patients, or other users. Coordinates are stored with a 1 km coarse jitter grid. All communications occur via the anonymized in-app SOS relay.
          </p>
        </div>
      </div>
    </div>
  );
};
