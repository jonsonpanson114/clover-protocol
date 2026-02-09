import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { UserStats } from '../types';

interface StatsRadarProps {
  stats: UserStats;
}

const StatsRadar: React.FC<StatsRadarProps> = ({ stats }) => {
  const data = [
    { subject: '優しさ', A: stats.kindness, fullMark: 100 },
    { subject: '楽しさ', A: stats.fun, fullMark: 100 },
    { subject: '言語化', A: stats.articulation, fullMark: 100 },
    { subject: '記憶力', A: stats.memory, fullMark: 100 },
  ];

  return (
    <div className="w-full h-full relative p-0 bg-white/80 backdrop-blur-md rounded-xl border-2 border-slate-900 shadow-xl flex items-center justify-center overflow-visible">
      <div className="absolute -top-2 -left-2 bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 z-20 rotate-[-4deg]">AGENT_STATS</div>
      <RadarChart cx="50%" cy="50%" outerRadius="60%" width={180} height={180} data={data}>
        <PolarGrid stroke="#1e293b" strokeWidth={1} strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="subject"
          tick={({ payload, x, y, cx, cy, ...rest }) => (
            <text
              x={x}
              y={y + (y > cy ? 5 : -5)}
              textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
              fill="#1e293b"
              fontSize={10}
              fontWeight={900}
              fontFamily="Zen Kaku Gothic New"
            >
              {payload.value}
            </text>
          )}
        />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="My Stats"
          dataKey="A"
          stroke="#1e293b"
          strokeWidth={2}
          fill="#fbbf24"
          fillOpacity={0.7}
        />
      </RadarChart>
    </div>
  );
};

export default StatsRadar;