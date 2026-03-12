import { SpecialMission, CharacterId } from './types';

export const SPECIAL_MISSIONS: SpecialMission[] = [
  // === 優しさ (kindness) ===
  {
    id: 'kindness_master',
    requiredStat: 'kindness',
    requiredValue: 50,
    title: '優しさの達人',
    description: 'kindness が50を超えたことで解放される特別ミッション。誰かのために、普段はしないような親切を行おう。',
    characterId: CharacterId.JACK,
    unlocked: false,
    completed: false,
  },
  {
    id: 'kindness_hero',
    requiredStat: 'kindness',
    requiredValue: 75,
    title: '慈愛の英雄',
    description: 'kindness が75を超えたことで解放される特別ミッション。1日3人以上に感謝を伝えよう。',
    characterId: CharacterId.JACK,
    unlocked: false,
    completed: false,
  },

  // === 楽しさ (fun) ===
  {
    id: 'fun_enthusiast',
    requiredStat: 'fun',
    requiredValue: 50,
    title: '楽しさの伝道師',
    description: 'fun が50を超えたことで解放される特別ミッション。退屈な作業をゲーム化して楽しもう。',
    characterId: CharacterId.HAL,
    unlocked: false,
    completed: false,
  },
  {
    id: 'fun_mastermind',
    requiredStat: 'fun',
    requiredValue: 75,
    title: '陽気なマスターマインド',
    description: 'fun が75を超えたことで解放される特別ミッション。今日一日を「映画の1シーン」として演出しよう。',
    characterId: CharacterId.HAL,
    unlocked: false,
    completed: false,
  },

  // === 記憶力 (memory) ===
  {
    id: 'memory_keeper',
    requiredStat: 'memory',
    requiredValue: 50,
    title: '記憶の守護者',
    description: 'memory が50を超えたことで解放される特別ミッション。1週間前の今日の出来事を詳細に思い出そう。',
    characterId: CharacterId.SAKI,
    unlocked: false,
    completed: false,
  },
  {
    id: 'memory_archivist',
    requiredStat: 'memory',
    requiredValue: 75,
    title: '時間の書庫管理者',
    description: 'memory が75を超えたことで解放される特別ミッション。子供の頃の思い出を5つ以上書き出そう。',
    characterId: CharacterId.SAKI,
    unlocked: false,
    completed: false,
  },

  // === 言語化力 (articulation) ===
  {
    id: 'articulation_poet',
    requiredStat: 'articulation',
    requiredValue: 50,
    title: '言葉の詩人',
    description: 'articulation が50を超えたことで解放される特別ミッション。感情を一言（10文字以内）で表現しよう。',
    characterId: CharacterId.REN,
    unlocked: false,
    completed: false,
  },
  {
    id: 'articulation_sorcerer',
    requiredStat: 'articulation',
    requiredValue: 75,
    title: '言葉の魔術師',
    description: 'articulation が75を超えたことで解放される特別ミッション。「愛」を「愛」という文字を使わずに説明しよう。',
    characterId: CharacterId.REN,
    unlocked: false,
    completed: false,
  },

  // === 効率性 (efficiency) ===
  {
    id: 'efficiency_optimizer',
    requiredStat: 'efficiency',
    requiredValue: 50,
    title: '最適化エンジニア',
    description: 'efficiency が50を超えたことで解放される特別ミッション。日常のタスクを5分以上短縮する方法を考えよう。',
    characterId: CharacterId.OPERATOR,
    unlocked: false,
    completed: false,
  },
  {
    id: 'efficiency_architect',
    requiredStat: 'efficiency',
    requiredValue: 75,
    title: '完璧なプロセス設計者',
    description: 'efficiency が75を超えたことで解放される特別ミッション。朝のルーチンをマニュアル化しよう。',
    characterId: CharacterId.OPERATOR,
    unlocked: false,
    completed: false,
  },
];

/**
 * 現在のステータスで解放できる特別ミッションを取得
 */
export const getUnlockableSpecialMissions = (
  stats: { kindness: number; fun: number; memory: number; articulation: number; efficiency: number },
  unlockedIds: string[]
): SpecialMission[] => {
  return SPECIAL_MISSIONS.filter(mission => {
    if (unlockedIds.includes(mission.id)) {
      return false; // 既に解放済み
    }

    const currentValue = stats[mission.requiredStat];
    return currentValue >= mission.requiredValue;
  });
};

/**
 * 指定されたステータスの特別ミッションを取得
 */
export const getSpecialMissionsByStat = (stat: keyof { kindness: number; fun: number; memory: number; articulation: number; efficiency: number }): SpecialMission[] => {
  return SPECIAL_MISSIONS.filter(mission => mission.requiredStat === stat);
};

/**
 * IDで特別ミッションを取得
 */
export const getSpecialMissionById = (id: string): SpecialMission | undefined => {
  return SPECIAL_MISSIONS.find(mission => mission.id === id);
};
