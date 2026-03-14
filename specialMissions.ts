import { SpecialMission, CharacterId } from './types';

export const SPECIAL_MISSIONS: SpecialMission[] = [
  // === 優しさ (kindness) ===
  {
    id: 'kindness_master',
    requiredStat: 'kindness',
    requiredValue: 50,
    title: '不意打ちの親切という名の暴力',
    description: '親切は時に暴力的なほどに相手を動かす。kindnessが50を超えた君に、特別な「演出」の機会を与えよう。',
    characterId: CharacterId.JACK,
    unlocked: false,
    completed: false,
  },
  {
    id: 'kindness_hero',
    requiredStat: 'kindness',
    requiredValue: 75,
    title: '重力に逆らう博愛主義',
    description: '地面に落ちる林檎のように、自然に感謝を他者に向けられるか。1日3人以上に、不自然なほどの感謝を伝えよ。',
    characterId: CharacterId.JACK,
    unlocked: false,
    completed: false,
  },

  // === 楽しさ (fun) ===
  {
    id: 'fun_enthusiast',
    requiredStat: 'fun',
    requiredValue: 50,
    title: '世界をBGMで染める作戦',
    description: '退屈な作業は、頭の中でロックンロールを鳴らしながらやればいい。funが50を超えた君なら、そのコツが分かるはずだ。',
    characterId: CharacterId.HAL,
    unlocked: false,
    completed: false,
  },
  {
    id: 'fun_mastermind',
    requiredStat: 'fun',
    requiredValue: 75,
    title: '陽気なマスターマインドの休暇',
    description: '今日一日を、最高にスリリングな映画の「伏線」として過ごしてみないか。君が主役、脚本はアドリブだ。',
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
    title: '人生という巨大なバグの修正',
    description: '君の日常には冗長なコードが多すぎる。5分間、無駄を削ぎ落とす「リファクタリング」を実行せよ。',
    characterId: CharacterId.OPERATOR,
    unlocked: false,
    completed: false,
  },
  {
    id: 'efficiency_architect',
    requiredStat: 'efficiency',
    requiredValue: 75,
    title: '完璧なプロセスの設計図',
    description: '朝のルーチンをAPI仕様書のように磨き上げろ。次に起きた時、君は迷いなくデプロイ（起動）できるはずだ。',
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
