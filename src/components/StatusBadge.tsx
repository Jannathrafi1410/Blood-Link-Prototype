import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Hourglass, XCircle, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'request' | 'verification' | 'freshness' | 'urgency';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'request',
  className = ''
}) => {
  // Configured with domain-specific healthcare colors + explicit icons + text
  let icon = <Clock className="w-3.5 h-3.5 text-slate-500" />;
  let colorStyle = 'text-slate-600 bg-slate-100/80 border-slate-200';

  if (status === 'CRITICAL' || status === 'EXPIRED' || status === 'REJECTED') {
    icon = <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
    colorStyle = 'text-red-700 bg-red-50 border-red-200';
  } else if (status === 'MATCHED' || status === 'FULFILLED' || status === 'TRUSTED' || status === 'CONFIRMED' || status === 'FRESH' || status === 'AVAILABLE') {
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    colorStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (status === 'SEARCHING_BANKS' || status === 'SEARCHING_DONORS' || status === 'DONORS_NOTIFIED' || status === 'PENDING' || status === 'RECENT') {
    icon = <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-pulse" />;
    colorStyle = 'text-amber-800 bg-amber-50 border-amber-200';
  } else if (status === 'PARTIALLY_MATCHED' || status === 'RESERVED' || status === 'AGING') {
    icon = <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;
    colorStyle = 'text-blue-800 bg-blue-50 border-blue-200';
  } else if (status === 'STALE' || status === 'CANCELLED' || status === 'UNAVAILABLE') {
    icon = <XCircle className="w-3.5 h-3.5 text-slate-500" />;
    colorStyle = 'text-slate-700 bg-slate-100 border-slate-200';
  }

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${colorStyle} ${className}`}
      role="status"
    >
      {icon}
      <span>{formatText(status)}</span>
    </span>
  );
};
