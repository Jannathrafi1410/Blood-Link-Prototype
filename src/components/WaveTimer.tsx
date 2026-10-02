import React, { useState, useEffect } from 'react';
import { Clock, FastForward, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

interface WaveTimerProps {
  initialSeconds?: number;
  waveNumber?: number;
  currentRadiusKm?: number;
  nextRadiusKm?: number;
  onTimeout?: () => void;
  className?: string;
}

export const WaveTimer: React.FC<WaveTimerProps> = ({
  initialSeconds = 180,
  waveNumber = 1,
  currentRadiusKm = 5,
  nextRadiusKm = 10,
  onTimeout,
  className = ''
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported:', e);
    }
  };

  const handleFastForward = async () => {
    try {
      await api.fastForwardTimeout();
      setSecondsLeft(0);
      if (soundEnabled) playChime();
      onTimeout?.();
    } catch (err) {
      console.error(err);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progressPercent = ((initialSeconds - secondsLeft) / initialSeconds) * 100;

  return (
    <div className={`p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Wave {waveNumber} Window: {currentRadiusKm} km Radius
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 text-slate-400 hover:text-white rounded"
            title={soundEnabled ? 'Mute Chimes' : 'Enable Audio Alert'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleFastForward}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-colors border border-slate-700"
            title="Fast-forward 180s for testing"
          >
            <FastForward className="w-3 h-3" />
            <span>Fast-Forward</span>
          </button>
        </div>
      </div>

      <div className="flex items-baseline justify-between text-xs">
        <span className="text-slate-400">
          Auto-escalates to {nextRadiusKm} km in:
        </span>
        <span className="font-mono text-lg font-black text-white">
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
