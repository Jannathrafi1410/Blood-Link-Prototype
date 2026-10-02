import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface MedicalDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  compact = false,
  className = ''
}) => {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          <strong>Medical Notice:</strong> Blood compatibility rules are advisory and require clinical review by a licensed transfusion medicine professional prior to crossmatch or administration.
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 ${className}`}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-900 uppercase tracking-wider text-[11px]">
            Clinical Transfusion & Advisory Notice
          </p>
          <p className="leading-relaxed text-amber-800">
            The Blood Availability Network facilitates proximity search and real-time coordination. Algorithmic compatibility calculations do not constitute medical certification or replace standard serological crossmatching, pathogen screening, or bedside verification by licensed clinical personnel.
          </p>
        </div>
      </div>
    </div>
  );
};
