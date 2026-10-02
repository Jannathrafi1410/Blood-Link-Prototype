import React from 'react';

interface MascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'alert' | 'proud';
  speechBubble?: string;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  size = 'md',
  speechBubble,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-10 h-12',
    md: 'w-16 h-20',
    lg: 'w-24 h-28',
    xl: 'w-36 h-44'
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses} shrink-0 select-none transition-transform hover:scale-105`}>
        <img
          src="/src/assets/mascot.svg"
          alt="Hemo - Blood Availability Network Mascot"
          className="w-full h-full object-contain filter drop-shadow-sm"
        />
      </div>
      {speechBubble && (
        <div className="relative bg-white border border-red-100 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 shadow-sm max-w-xs">
          {/* Arrow */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-red-100 rotate-45" />
          <span className="relative z-10">{speechBubble}</span>
        </div>
      )}
    </div>
  );
};
