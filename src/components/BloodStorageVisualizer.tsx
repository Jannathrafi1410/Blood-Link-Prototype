import React, { useState } from 'react';
import { InventoryItem, BloodGroup, BloodComponent } from '../types';
import { Droplet, Thermometer, ShieldCheck, Clock, Layers } from 'lucide-react';

interface BloodStorageVisualizerProps {
  inventory: InventoryItem[];
  onSelectComponent?: (comp: BloodComponent) => void;
  className?: string;
}

export const BloodStorageVisualizer: React.FC<BloodStorageVisualizerProps> = ({
  inventory,
  onSelectComponent,
  className = ''
}) => {
  const [activeShelf, setActiveShelf] = useState<BloodComponent>('Whole Blood');

  const shelves: { component: BloodComponent; temp: string; iconLabel: string; desc: string }[] = [
    { component: 'Whole Blood', temp: '2°C to 6°C', iconLabel: 'Cold Chamber 1', desc: 'Citrate phosphate dextrose storage' },
    { component: 'Red Cells', temp: '2°C to 6°C', iconLabel: 'Cold Chamber 2', desc: 'High-hematocrit erythrocyte rack' },
    { component: 'Platelets', temp: '20°C to 24°C', iconLabel: 'Agitator Unit', desc: 'Continuous gentle horizontal agitation' },
    { component: 'Plasma', temp: '-30°C Cryo', iconLabel: 'Deep Freeze -30°', desc: 'Fresh frozen plasma cryo-storage' }
  ];

  const currentShelfItems = inventory.filter(i => i.component === activeShelf);

  const getGroupUnits = (group: BloodGroup) => {
    return currentShelfItems
      .filter(i => i.bloodGroup === group && i.status === 'AVAILABLE')
      .reduce((sum, i) => sum + i.units, 0);
  };

  const allGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Transfusion Cold Storage & Shelf Monitor</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical refrigeration bay status at Jubilee Mission Blood Centre (Thrissur)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
          <Thermometer className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="font-semibold">All Chambers Temp-Compliant (Calibrated)</span>
        </div>
      </div>

      {/* Shelf Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {shelves.map(shelf => {
          const isSelected = activeShelf === shelf.component;
          const totalUnitsInShelf = inventory
            .filter(i => i.component === shelf.component && i.status === 'AVAILABLE')
            .reduce((sum, i) => sum + i.units, 0);

          return (
            <button
              key={shelf.component}
              onClick={() => {
                setActiveShelf(shelf.component);
                onSelectComponent?.(shelf.component);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold opacity-80">{shelf.iconLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-700'}`}>
                  {shelf.temp}
                </span>
              </div>
              <div className="font-bold text-xs mt-1.5">{shelf.component}</div>
              <div className="text-[11px] mt-1 opacity-90">
                <strong>{totalUnitsInShelf}</strong> Units Available
              </div>
            </button>
          );
        })}
      </div>

      {/* Physical Bag Rack Visualizer */}
      <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-4">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
          <span className="font-bold uppercase tracking-wider text-slate-300">
            Bay {activeShelf} · Live Shelf Inventory
          </span>
          <span className="text-[11px] text-slate-400">
            Click any rack to review batch verification
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {allGroups.map(bg => {
            const count = getGroupUnits(bg);
            const hasStock = count > 0;

            return (
              <div
                key={bg}
                className={`p-3 rounded-xl border text-center transition-all ${
                  hasStock
                    ? 'bg-slate-800 border-emerald-500/40 text-white shadow-xs'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="w-8 h-10 mx-auto relative flex items-center justify-center">
                  {/* Blood Bag Vector Outline */}
                  <svg viewBox="0 0 24 32" className={`w-7 h-9 ${hasStock ? 'text-red-500 fill-red-500/30' : 'text-slate-700'}`}>
                    <path
                      d="M8 2h8v4h2a2 2 0 0 1 2 2v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h2V2z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-extrabold text-white">
                    {bg}
                  </span>
                </div>

                <div className="mt-2 font-mono font-bold text-xs">
                  {count} <span className="text-[9px] font-normal text-slate-400">units</span>
                </div>
                <div className={`text-[10px] font-semibold mt-0.5 ${hasStock ? 'text-emerald-400' : 'text-red-400'}`}>
                  {hasStock ? 'Stocked' : 'Nil'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
