import React from 'react';
import { SeasonalEvent } from '../types';
import { Sparkles, X, Gift } from 'lucide-react';

interface SeasonalBannerProps {
  event: SeasonalEvent;
  onDismiss: () => void;
}

const SeasonalBanner: React.FC<SeasonalBannerProps> = ({ event, onDismiss }) => {
  return (
    <div className={`
      ${event.themeColor} border-b-2 border-black py-3 px-4
      relative overflow-hidden
    `}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-current rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-current rounded-full blur-2xl"></div>
      </div>

      <div className="relative flex items-center justify-between gap-4 max-w-4xl mx-auto">
        {/* Left: Event Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className="text-4xl flex-shrink-0 animate-pulse-slow">
            {event.icon}
          </div>

          {/* Text */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="bg-black text-white text-[10px] font-black px-2 py-0.5">
                SEASONAL EVENT
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              {event.name}
            </h2>
            <p className="text-sm font-bold text-slate-700 mt-1 line-clamp-2">
              {event.specialStory}
            </p>
          </div>
        </div>

        {/* Right: Dismiss */}
        <button
          onClick={onDismiss}
          className="p-2 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
          title="閉じる"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Floating decoration */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center animate-bounce">
        <Gift className="w-4 h-4 text-black" />
      </div>
    </div>
  );
};

export default SeasonalBanner;
