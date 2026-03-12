import React, { useState, useEffect } from 'react';
import { SpecialMission, CharacterId } from '../types';
import { CHARACTERS } from '../constants';
import { Trophy, Lock, ArrowRight } from 'lucide-react';

interface SpecialMissionModalProps {
  missions: SpecialMission[];
  onStartMission: (missionId: string, characterId?: CharacterId) => void;
  onClose: () => void;
}

const SpecialMissionModal: React.FC<SpecialMissionModalProps> = ({ missions, onStartMission, onClose }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (missions.length === 0) {
    return null;
  }

  const getStatColor = (stat: keyof { kindness: number; fun: number; memory: number; articulation: number; efficiency: number }) => {
    switch (stat) {
      case 'kindness': return 'text-rose-500 bg-rose-50 border-rose-200';
      case 'fun': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'memory': return 'text-indigo-500 bg-indigo-50 border-indigo-200';
      case 'articulation': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'efficiency': return 'text-purple-500 bg-purple-50 border-purple-200';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  const getStatLabel = (stat: string) => {
    const labels: Record<string, string> = {
      kindness: '優しさ',
      fun: '楽しさ',
      memory: '記憶力',
      articulation: '言語化',
      efficiency: '効率性'
    };
    return labels[stat] || stat;
  };

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`
        relative max-w-2xl w-full bg-emerald-400 border-8 border-black p-6 shadow-[12px_12px_0_0_#fff]
        transform transition-all duration-500 max-h-[85vh] overflow-y-auto
        ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
      `}>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-black text-white flex items-center justify-center font-black animate-pulse">
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-1" />
            <span className="text-xs">NEW</span>
          </div>
        </div>

        <div className="space-y-5">
          {/* Header */}
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-2xl font-black text-black flex items-center gap-2">
              <Trophy className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              特別ミッション解放
            </h2>
            <p className="font-bold text-slate-600 mt-2">
              ステータスが一定値を超えたことで、新しい特別ミッションが解放されました！
            </p>
          </div>

          {/* Mission List */}
          <div className="space-y-4">
            {missions.map((mission) => {
              const colors = getStatColor(mission.requiredStat);
              const character = mission.characterId ? CHARACTERS[mission.characterId] : null;

              return (
                <div key={mission.id} className={`
                  bg-white border-2 border-black p-5 shadow-[3px_3px_0_0_#000]
                  hover:scale-102 hover:translate-x-1 transition-all
                `}>
                  {/* Mission Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {character && (
                      <div className="w-12 h-12 border-2 border-black overflow-hidden bg-slate-100 shrink-0">
                        <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover grayscale" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className={`inline-block ${colors} border px-2 py-0.5 text-[10px] font-black mb-1`}>
                        {getStatLabel(mission.requiredStat)} {mission.requiredValue}+
                      </div>
                      <h3 className="text-lg font-black text-black">{mission.title}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-bold text-slate-700 mb-4 text-sm">
                    {mission.description}
                  </p>

                  {/* Start Button */}
                  <button
                    onClick={() => onStartMission(mission.id, mission.characterId)}
                    className="w-full neo-btn bg-black text-white py-3 font-black flex items-center justify-center gap-2 hover:bg-slate-800"
                  >
                    <Lock className="w-4 h-4" />
                    ミッションを開始 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full neo-btn bg-white border-2 border-black py-3 font-bold hover:bg-slate-100"
          >
            後で挑戦する
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecialMissionModal;
