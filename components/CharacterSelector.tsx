import React from 'react';
import { CharacterId, Character } from '../types';
import { CHARACTERS } from '../constants';
import { Check, Lock } from 'lucide-react';

interface CharacterSelectorProps {
  onSelect: (id: CharacterId) => void;
  selectedId: CharacterId;
  dailyProgress: Record<CharacterId, boolean>;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({ onSelect, selectedId, dailyProgress }) => {

  // Color mapping for the borders/shadows
  const getColors = (charId: CharacterId) => {
    switch (charId) {
      case CharacterId.JACK: return 'bg-rose-400 border-slate-900';
      case CharacterId.HAL: return 'bg-amber-400 border-slate-900';
      case CharacterId.SAKI: return 'bg-indigo-400 border-slate-900';
      case CharacterId.REN: return 'bg-emerald-400 border-slate-900';
      default: return 'bg-slate-200 border-slate-900';
    }
  };

  return (
    <div className="w-full pb-4 pt-2">
      <div className="grid grid-cols-4 gap-2 md:gap-3 px-1">
        {Object.values(CHARACTERS).map((char: Character) => {
          const isCompleted = !!dailyProgress[char.id];
          const isSelected = selectedId === char.id;
          const colors = getColors(char.id);

          return (
            <button
              key={char.id}
              onClick={() => onSelect(char.id)}
              className={`
                group relative transition-all duration-300 ease-out flex flex-col items-center
                ${isSelected ? '-translate-y-2 scale-105 z-10' : 'hover:-translate-y-1 hover:scale-102 opacity-80 hover:opacity-100'}
              `}
            >
              {/* Badge */}
              {isCompleted && (
                <div className="absolute -top-2 -right-1 z-20 bg-slate-900 text-white border-2 border-white rounded-full p-0.5 shadow-md rotate-12">
                  <Check className="w-3 h-3 md:w-4 md:h-4 stroke-[4]" />
                </div>
              )}

              {/* Card Body */}
              <div className={`
                 w-full aspect-[3/4] rounded-lg border-2 md:border-[3px] border-slate-900 flex flex-col items-center justify-end overflow-hidden
                 shadow-[2px_2px_0px_0px_#1e293b] relative bg-white
              `}>
                {/* Background Stripe */}
                <div className={`absolute inset-0 ${colors} opacity-20 group-hover:opacity-40 transition-opacity`}></div>

                {/* Character Image */}
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500
                        ${isCompleted ? 'grayscale opacity-70' : 'grayscale-0'}
                    `}
                />

                {/* Name Tag */}
                <div className={`
                    relative w-full py-0.5 text-center border-t-2 md:border-t-[3px] border-slate-900
                    ${isSelected ? colors : 'bg-white'}
                 `}>
                  <span className={`
                        font-display text-[10px] md:text-xs tracking-tighter text-slate-900 uppercase
                        ${isSelected ? 'font-black' : 'font-bold'}
                    `}>
                    {char.name}
                  </span>
                </div>
              </div>

              {/* Selection Indicator (Triangle) */}
              {isSelected && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 
                      border-l-[6px] border-l-transparent
                      border-r-[6px] border-r-transparent
                      border-b-[10px] border-b-slate-900 animate-bounce"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelector;