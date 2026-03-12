import React, { useState, useEffect } from 'react';
import { StoryBranch, CharacterId } from '../types';
import { CHARACTERS } from '../constants';
import { Users, User, ArrowRight, Sparkles } from 'lucide-react';

interface WeekendModalProps {
  week: number;
  onSelect: (branch: StoryBranch) => void;
  onClose: () => void;
}

const WeekendModal: React.FC<WeekendModalProps> = ({ week, onSelect, onClose }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const branches: { id: StoryBranch; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'solo', label: 'ソロミッション', icon: <User className="w-6 h-6" />, color: 'bg-slate-200' },
    { id: CharacterId.JACK, label: 'ジャック', icon: null, color: 'bg-rose-200' },
    { id: CharacterId.HAL, label: 'ハル', icon: null, color: 'bg-amber-200' },
    { id: CharacterId.SAKI, label: 'サキ', icon: null, color: 'bg-indigo-200' },
    { id: CharacterId.REN, label: 'レン', icon: null, color: 'bg-emerald-200' },
    { id: CharacterId.OPERATOR, label: 'オペレーター', icon: null, color: 'bg-purple-200' },
  ];

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`
        relative max-w-3xl w-full bg-cyan-300 border-8 border-black p-6 shadow-[12px_12px_0_0_#fff]
        transform transition-all duration-500
        ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
      `}>

        {/* Decorative elements */}
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-black text-white border-4 border-white flex items-center justify-center font-black animate-pulse">
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-1" />
            <span className="text-xs">WEEKEND</span>
          </div>
        </div>
        <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-yellow-400 border-2 border-black animate-bounce"></div>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-black text-black">
                週末の作戦会議
              </h2>
            </div>
            <p className="font-bold text-slate-700">
              Week {week} の物語は、誰と共に紡ぐ？
            </p>
            <p className="text-sm font-bold text-slate-500 mt-2">
              選択した相棒によって、来週のミッション内容が変化します。
            </p>
          </div>

          {/* Branch Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {branches.map((branch) => {
              const char = branch.id !== 'solo' ? CHARACTERS[branch.id as CharacterId] : null;

              return (
                <button
                  key={branch.id}
                  onClick={() => onSelect(branch.id)}
                  className={`
                    neo-btn ${branch.color} border-2 border-black p-4 shadow-[3px_3px_0_0_#000]
                    hover:scale-105 hover:translate-x-1 transition-all
                    flex flex-col items-center gap-3 min-h-[140px]
                  `}
                >
                  {branch.icon}
                  {char && (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-16 h-20 object-cover border-2 border-black bg-white"
                    />
                  )}
                  <span className="font-black text-black text-sm">
                    {branch.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skip Button */}
          <button
            onClick={onClose}
            className="w-full neo-btn bg-white border-2 border-black py-3 font-bold hover:bg-slate-100"
          >
            後で選ぶ（ランダム選択）
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeekendModal;
