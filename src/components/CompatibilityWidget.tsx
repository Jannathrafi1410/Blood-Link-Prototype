import React, { useState } from 'react';
import { BloodGroup, BloodComponent } from '../types';
import { COMPATIBILITY_RULES, getCompatibleDonorGroups } from '../../server/compatibility';
import { ShieldCheck, AlertCircle, Droplet, Check, Info } from 'lucide-react';

export const CompatibilityWidget: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [selectedRecipient, setSelectedRecipient] = useState<BloodGroup>('O-');
  const [selectedComponent, setSelectedComponent] = useState<BloodComponent>('Whole Blood');

  const allGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const compatibleDonors = getCompatibleDonorGroups(selectedRecipient, selectedComponent);

  const activeRule = COMPATIBILITY_RULES.find(
    r => r.recipientGroup === selectedRecipient && r.component === selectedComponent
  );

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 ${className}`}>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-600 fill-red-600" />
            <span>Interactive Blood Compatibility Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Component-specific immunological compatibility calculations (Red Cells, Whole Blood, Plasma, Platelets)
          </p>
        </div>
        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
          Clinical Transfusion Advisory
        </span>
      </div>

      {/* Recipient Blood Group & Component Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            1. Select Patient Recipient Group:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {allGroups.map(bg => (
              <button
                key={bg}
                onClick={() => setSelectedRecipient(bg)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedRecipient === bg
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            2. Select Transfusion Component:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['Whole Blood', 'Red Cells', 'Platelets', 'Plasma'] as BloodComponent[]).map(comp => (
              <button
                key={comp}
                onClick={() => setSelectedComponent(comp)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                  selectedComponent === comp
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compatibility Matrix Visualizer */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
          <span>Compatible Donor Blood Groups:</span>
          <span className="text-xs text-slate-500 font-normal">
            Recipient {selectedRecipient} ({selectedComponent})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allGroups.map(bg => {
            const isMatch = compatibleDonors.includes(bg);
            const isIdentical = bg === selectedRecipient;

            return (
              <div
                key={bg}
                className={`p-3.5 rounded-xl border transition-all ${
                  isMatch
                    ? isIdentical
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-extrabold ${isMatch ? 'text-red-600' : 'text-slate-400'}`}>
                    {bg}
                  </span>
                  {isMatch ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{isIdentical ? 'Identical' : 'Compatible'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Incompatible</span>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-slate-600">
                  {bg === 'O-' && <span className="font-semibold text-emerald-800">Universal Red Cells</span>}
                  {bg === 'AB+' && <span className="font-semibold text-purple-800">Universal Recipient</span>}
                  {bg === 'AB-' && <span className="font-semibold text-blue-800">Universal Plasma Donor</span>}
                  {!['O-', 'AB+', 'AB-'].includes(bg) && (
                    <span>Standard ABO/Rh Group</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Guidance Footnote */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Clinical Directive for {selectedRecipient} {selectedComponent}:</span>
        </div>
        <p className="text-slate-600 text-xs pl-5">
          {activeRule?.guidelines || 'Requires serological crossmatching prior to clinical transfusion.'}
        </p>
      </div>
    </div>
  );
};
