import React, { useState } from 'react';
import { UserRole } from '../types';
import { api } from '../services/api';
import {
  Play,
  RotateCcw,
  FastForward,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  Sparkles,
  X
} from 'lucide-react';

interface DemoTourBarProps {
  onSelectRole: (role: UserRole) => void;
  onRefreshData?: () => void;
  onRequestViewChange?: (requestId: string) => void;
}

export const DemoTourBar: React.FC<DemoTourBarProps> = ({
  onSelectRole,
  onRefreshData,
  onRequestViewChange
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpen, setIsOpen] = useState(true);
  const [isRunningAuto, setIsRunningAuto] = useState(false);

  const steps = [
    {
      step: 1,
      title: '1. Emergency SOS Broadcast',
      summary: 'ABC Hospital creates critical request BAN-10291 for 2 units O- Whole Blood.',
      badge: 'REQUEST CREATED',
      role: 'HOSPITAL' as UserRole,
      detail:
        'Dr. Thomas Mathew at ABC Hospital Thrissur initiates emergency triage. The system sanitizes notes and geocodes pincode 680001.'
    },
    {
      step: 2,
      title: '2. Bank-First Inventory Check',
      summary: 'Queries 3 nearby blood banks within 25 km.',
      badge: '0 UNITS IN STOCK',
      role: 'BLOOD_BANK' as UserRole,
      detail:
        'Jubilee Mission, Amala, and General Hospital inventories are scanned. With 0 units of O- Whole Blood available, the engine instantly escalates to the donor network.'
    },
    {
      step: 3,
      title: '3. Geographic & Eligibility Pipeline',
      summary: '23 Potential -> 11 Eligible -> 6 within 5 km.',
      badge: 'HARD FILTERS APPLIED',
      role: 'ADMIN' as UserRole,
      detail:
        'Stage 1 filters eliminate ineligible donors (donation cooldown < 90 days, marked unavailable, or travel history), leaving 6 verified donors within the 5 km wave.'
    },
    {
      step: 4,
      title: '4. Wave 1 Notification Dispatch',
      summary: 'Top 3 ranked candidates notified: D-014, D-207, D-092.',
      badge: 'TOP 3 NOTIFIED',
      role: 'HOSPITAL' as UserRole,
      detail:
        'Multi-factor scoring ranks candidates. To prevent alert fatigue, only the top 3 candidates receive encrypted alerts with a 180-second response window.'
    },
    {
      step: 5,
      title: '5. Match Confirmed & Zero-PII Relay',
      summary: 'Candidate D-014 accepts -> Transfusion linked via Masked Relay.',
      badge: 'ZERO CONTACT EXPOSED',
      role: 'DONOR' as UserRole,
      detail:
        'Rahul Varma (D-014) accepts. The hospital receives confirmation with candidate ID and distance only. All communications happen via the phone-filtered relay.'
    }
  ];

  const activeStepData = steps[currentStep - 1];

  const handleGoToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    const target = steps[stepNumber - 1];
    onSelectRole(target.role);
    onRequestViewChange?.('BAN-10291');
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      handleGoToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      handleGoToStep(currentStep - 1);
    }
  };

  const handleRunFullScenario = async () => {
    setIsRunningAuto(true);
    try {
      await api.runThrissurDemo();
      onRefreshData?.();
      handleGoToStep(5);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningAuto(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 hover:bg-slate-800 transition-all"
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Open Clinical Walkthrough Guide</span>
      </button>
    );
  }

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Column: Title & Steps Progress */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-amber-400">
                  Clinical Demo Walkthrough
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  · Thrissur O- Benchmark (BAN-10291)
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                {activeStepData.title}: <span className="font-normal text-slate-300">{activeStepData.summary}</span>
              </div>
            </div>
          </div>

          {/* Step Pill Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {steps.map(s => (
              <button
                key={s.step}
                onClick={() => handleGoToStep(s.step)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  currentStep === s.step
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : currentStep > s.step
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Step {s.step}
              </button>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === steps.length}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleRunFullScenario}
              disabled={isRunningAuto}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isRunningAuto ? 'Running...' : 'Run Auto Demo'}</span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 ml-1"
              title="Hide Walkthrough"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
