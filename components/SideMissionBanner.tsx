import React, { useState, useEffect } from 'react';
import { SideMission } from '../types';
import { CHARACTERS } from '../constants';
import { Zap, Clock, X } from 'lucide-react';

interface SideMissionBannerProps {
  mission: SideMission;
  onAccept: () => void;
  onDismiss: () => void;
}

const SideMissionBanner: React.FC<SideMissionBannerProps> = ({ mission, onAccept, onDismiss }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateRemaining = () => {
      const now = Date.now();
      const diff = mission.expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining('期限切れ');
        return;
      }

      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // 毎分更新
    return () => clearInterval(interval);
  }, [mission.expiresAt]);

  const isExpired = timeRemaining === '期限切れ';
  const character = CHARACTERS[mission.characterId];

  return (
    <div className={`
      bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-black
      rounded-lg shadow-[3px_3px_0_0_#000] p-3 mb-4
      ${isExpired ? 'opacity-50 grayscale' : 'animate-pulse-slow'}
    `}>
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Character Icon */}
          <div className="w-10 h-10 border-2 border-black rounded-full overflow-hidden bg-white flex-shrink-0">
            {character ? (
              <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200">
                <Zap className="w-5 h-5 text-slate-500" />
              </div>
            )}
          </div>

          {/* Mission Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 animate-pulse">
                BONUS
              </span>
              <span className={`text-xs font-black ${isExpired ? 'text-red-500' : 'text-amber-600'}`}>
                <Clock className="w-3 h-3 inline mr-1" />
                {timeRemaining}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {mission.title}
            </h3>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isExpired && (
            <button
              onClick={onAccept}
              className="neo-btn bg-black text-white px-3 py-1.5 text-xs font-bold hover:bg-slate-800"
            >
              受ける
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideMissionBanner;
