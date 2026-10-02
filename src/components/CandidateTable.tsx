import React from 'react';
import { CandidateMatch } from '../types';
import { ShieldCheck, MessageSquare, Award, Navigation } from 'lucide-react';

interface CandidateTableProps {
  candidates: CandidateMatch[];
  onOpenRelay?: (candidateId: string) => void;
  onOpenRoute?: (candidateId: string, distanceKm: number) => void;
  className?: string;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  onOpenRelay,
  onOpenRoute,
  className = ''
}) => {
  return (
    <div className={`overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xs ${className}`}>
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anonymous Candidate Queue</span>
          </h3>
          <p className="text-xs text-slate-500">
            Ranked by proximity, compatibility, response rate, and recent activity. All contact details remain strictly masked.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
          {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''} in Wave
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4">Rank</th>
              <th className="py-2.5 px-4">Candidate ID</th>
              <th className="py-2.5 px-4">Blood Group</th>
              <th className="py-2.5 px-4">Approx Distance</th>
              <th className="py-2.5 px-4">Match Score</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Privacy Relay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No donor candidates currently active in this wave.
                </td>
              </tr>
            ) : (
              candidates.map((c, idx) => {
                const isAccepted = c.notificationStatus === 'ACCEPTED';
                const isSent = c.notificationStatus === 'SENT';

                return (
                  <tr
                    key={c.candidateId}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isAccepted ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {idx === 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <Award className="w-3.5 h-3.5" />
                          #{idx + 1}
                        </span>
                      ) : (
                        `#${idx + 1}`
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {c.candidateId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                        {c.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      ~{c.approxDistanceKm.toFixed(1)} km
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {Math.round(c.matchScore * 100)}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              c.matchScore >= 0.9
                                ? 'bg-emerald-600'
                                : c.matchScore >= 0.75
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.round(c.matchScore * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isSent
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.notificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenRoute?.(c.candidateId, c.approxDistanceKm)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg text-[11px] transition-colors"
                          title="View Geodesic Transit Route"
                        >
                          <Navigation className="w-3 h-3 text-red-600" />
                          <span>Route</span>
                        </button>

                        {isAccepted ? (
                          <button
                            onClick={() => onOpenRelay?.(c.candidateId)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Coordinate</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic px-1">
                            Awaiting
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
