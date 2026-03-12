import { SideMission, CharacterId } from '../types';

// サイドミッションのテンプレート
const SIDE_MISSION_TEMPLATES = [
  {
    title: '緊急：感情報告',
    description: '今の感情を1行で日記に書き留めてください。',
    statReward: 'kindness' as const,
    statAmount: 5,
  },
  {
    title: 'リフレッシュ作戦',
    description: '深呼吸を3回して、心拍数を落ち着けてください。',
    statReward: 'fun' as const,
    statAmount: 5,
  },
  {
    title: '記憶の断片',
    description: '昨日の夕飯を思い出して、詳細を書き留めてください。',
    statReward: 'memory' as const,
    statAmount: 5,
  },
  {
    title: '言葉の種',
    description: '「平和」という言葉を使わずに平和について表現してください。',
    statReward: 'articulation' as const,
    statAmount: 5,
  },
  {
    title: 'プロセス改善',
    description: '日常の1つの作業を10秒短縮する方法を考えてください。',
    statReward: 'efficiency' as const,
    statAmount: 5,
  },
  {
    title: '誰かへの感謝',
    description: '誰かに心の中で「ありがとう」と言ってください。',
    statReward: 'kindness' as const,
    statAmount: 8,
  },
  {
    title: '笑顔の練習',
    description: '鏡を見て5秒間笑ってください。',
    statReward: 'fun' as const,
    statAmount: 8,
  },
  {
    title: '記憶の確認',
    description: '1週間前の今日の天気を思い出してください。',
    statReward: 'memory' as const,
    statAmount: 8,
  },
  {
    title: '比喩の創造',
    description: '「希望」を「冷蔵庫」に例えてみてください。',
    statReward: 'articulation' as const,
    statAmount: 8,
  },
  {
    title: 'タイムボックス',
    description: '気になっていることを5分だけ考えて、その後は忘れてください。',
    statReward: 'efficiency' as const,
    statAmount: 8,
  },
];

/**
 * ランダムなサイドミッションを生成
 * @param day 現在の日数
 * @returns 生成されたサイドミッション
 */
export const generateSideMission = (day: number): SideMission | null => {
  // 20%の確率で生成
  if (Math.random() > 0.2) {
    return null;
  }

  const template = SIDE_MISSION_TEMPLATES[Math.floor(Math.random() * SIDE_MISSION_TEMPLATES.length)];

  return {
    id: `side_${day}_${Date.now()}`,
    title: template.title,
    description: template.description,
    characterId: getRandomCharacterId(),
    statReward: template.statReward,
    statAmount: template.statAmount,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24時間後
    completed: false,
  };
};

/**
 * 期限切れのサイドミッションを除外
 */
export const checkExpiredMissions = (missions: SideMission[]): SideMission[] => {
  const now = Date.now();
  return missions.filter(mission => !mission.completed && mission.expiresAt > now);
};

/**
 * サイドミッションを完了状態にする
 */
export const completeSideMission = (missions: SideMission[], missionId: string): SideMission[] => {
  return missions.map(mission =>
    mission.id === missionId ? { ...mission, completed: true } : mission
  );
};

/**
 * ランダムなキャラクターIDを取得
 */
function getRandomCharacterId(): CharacterId {
  const characters: CharacterId[] = [
    CharacterId.JACK,
    CharacterId.HAL,
    CharacterId.SAKI,
    CharacterId.REN,
    CharacterId.OPERATOR,
  ];
  return characters[Math.floor(Math.random() * characters.length)];
}

/**
 * 有効期限までの残り時間を取得
 */
export const getTimeRemaining = (expiresAt: number): string => {
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) return '期限切れ';

  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `残り${hours}時間${minutes}分`;
  }
  return `残り${minutes}分`;
};
