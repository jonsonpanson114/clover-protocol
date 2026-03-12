import React, { useState, useEffect } from 'react';
import { RandomEvent } from '../types';
import { Sparkles, Gift, AlertTriangle, Zap } from 'lucide-react';

interface EventModalProps {
  event: RandomEvent;
  onAccept: () => void;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onAccept, onClose }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const getEventIcon = () => {
    switch (event.type) {
      case 'emergency':
        return <AlertTriangle className="w-8 h-8 fill-rose-500 text-rose-500" />;
      case 'bonus':
      case 'gift':
        return <Gift className="w-8 h-8 fill-amber-500 text-amber-500" />;
      case 'special_encounter':
        return <Sparkles className="w-8 h-8 fill-purple-500 text-purple-500" />;
      default:
        return <Zap className="w-8 h-8 text-slate-500" />;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case 'emergency':
        return 'bg-rose-400 border-rose-500';
      case 'bonus':
      case 'gift':
        return 'bg-amber-400 border-amber-500';
      case 'special_encounter':
        return 'bg-purple-400 border-purple-500';
      default:
        return 'bg-slate-200 border-slate-500';
    }
  };

  const color = getEventColor();
  const icon = getEventIcon();

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`
        relative max-w-md w-full ${color} border-8 border-black p-6 shadow-[12px_12px_0_0_#fff]
        transform transition-all duration-500
        ${showContent ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}
      `}>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-10 h-10 bg-black text-white flex items-center justify-center font-black text-sm animate-pulse">
          EVENT
        </div>
        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border-2 border-black animate-spin-slow"></div>

        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="bg-white border-2 border-black p-2 rounded-lg shadow-md">
              {icon}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-black bg-white/50 px-2 py-0.5 inline-block mb-1">
                {event.type.toUpperCase().replace('_', ' ')}
              </div>
              <h2 className="text-xl font-black text-black leading-tight">
                {event.title}
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border-2 border-black p-4 shadow-[2px_2px_0_0_#000]">
            <p className="font-bold text-slate-800 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Reward */}
          {event.statReward && event.statAmount && (
            <div className="flex items-center gap-2 bg-black/10 border-2 border-black p-3">
              <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-black">
                REWARD: {event.statReward.toUpperCase()} +{event.statAmount}
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onAccept}
              className={`
                flex-1 neo-btn bg-black text-white py-4 font-black text-lg
                hover:bg-slate-800 hover:scale-105 transition-transform
              `}
            >
              受諾
            </button>
            <button
              onClick={onClose}
              className={`
                neo-btn bg-white border-2 border-black py-4 px-6 font-bold text-lg
                hover:bg-slate-100 hover:rotate-1 transition-transform
              `}
            >
              後で
            </button>
          </div>
        </div>
      </div>

      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="absolute animate-fall" style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDelay: `${Math.random() * 1}s`,
            animationDuration: `${1.5 + Math.random() * 2}s`
          }}>
            <Sparkles className={`w-4 h-4 ${['text-rose-400', 'text-amber-400', 'text-purple-400'][i % 3]}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventModal;
