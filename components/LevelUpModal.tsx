import React, { useEffect, useState } from 'react';
import { Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
    day: number;
    onNext: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ day, onNext }) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className={`relative max-w-lg w-full bg-yellow-400 border-8 border-black p-8 shadow-[12px_12px_0_0_#fff] transform transition-all duration-700 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-rose-500 border-4 border-black animate-spin-slow"></div>
                <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-cyan-500 border-4 border-black animate-bounce"></div>

                <div className="text-center space-y-6">
                    <div className="inline-block bg-black text-white px-4 py-1 text-xl font-black tracking-widest transform -rotate-2">
                        MISSION COMPLETE
                    </div>

                    <h2 className="text-6xl font-display font-black text-black leading-none tracking-tighter">
                        DAY {day} <br />CLEARED
                    </h2>

                    <div className="flex justify-center gap-2 text-rose-600">
                        <Trophy className="w-8 h-8 fill-rose-600" />
                        <Trophy className="w-8 h-8 fill-rose-600" />
                        <Trophy className="w-8 h-8 fill-rose-600" />
                    </div>

                    <p className="text-xl font-bold font-mono text-slate-900 border-y-4 border-black py-4 bg-white/50">
                        「見事だ。だが、本当の戦いは明日から始まる。」
                    </p>

                    <button
                        onClick={onNext}
                        className="w-full neo-btn bg-black text-white text-2xl py-4 flex items-center justify-center gap-2 hover:bg-slate-800 hover:scale-105 transition-transform"
                    >
                        NEXT DAY <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Confetti effect (Simplified CSS based) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="absolute animate-fall" style={{
                        left: `${Math.random() * 100}%`,
                        top: `-20px`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 3}s`
                    }}>
                        <Sparkles className={`w-6 h-6 ${['text-rose-500', 'text-cyan-500', 'text-yellow-500'][i % 3]}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LevelUpModal;
