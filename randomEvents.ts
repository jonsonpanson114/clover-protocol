import { RandomEvent, CharacterId } from './types';

export const RANDOM_EVENTS: RandomEvent[] = [
  // === 緊急ミッション ===
  {
    id: 'emergency_mission_1',
    type: 'emergency',
    title: '緊急事態発生！',
    description: '突然の連絡が入った。「急ぎで来てくれ。そうじゃないと大事なものが消える」……一体何が起きている？',
    statReward: 'kindness',
    statAmount: 10,
    characterId: CharacterId.JACK,
    probability: 0.08,
  },
  {
    id: 'emergency_mission_2',
    type: 'emergency',
    title: '緊急リクエスト',
    description: '予期せぬギャンブルのチャンスが来た。オッズは絶望的だが、人生は賭けだろ？',
    statReward: 'fun',
    statAmount: 10,
    characterId: CharacterId.HAL,
    probability: 0.08,
  },
  {
    id: 'emergency_mission_3',
    type: 'emergency',
    title: 'データ消失の危機',
    description: '重要な記憶が消えかかっている。今すぐ確認作業が必要だ。',
    statReward: 'memory',
    statAmount: 10,
    characterId: CharacterId.SAKI,
    probability: 0.08,
  },
  {
    id: 'emergency_mission_4',
    type: 'emergency',
    title: '重要なプレゼン直前',
    description: '1時間後に重要な話し合いがある。今のうちに言葉を練習しておこう。',
    statReward: 'articulation',
    statAmount: 10,
    characterId: CharacterId.REN,
    probability: 0.08,
  },
  {
    id: 'emergency_mission_5',
    type: 'emergency',
    title: 'システムエラー',
    description: '君の生活プロセスに非効率な箇所が検出された。すぐに最適化が必要だ。',
    statReward: 'efficiency',
    statAmount: 10,
    characterId: CharacterId.OPERATOR,
    probability: 0.06,
  },

  // === ボーナス ===
  {
    id: 'bonus_gift_1',
    type: 'gift',
    title: '謎のプレゼント',
    description: '誰かが君の部屋に何かを置いていった。……それは美味しいコーヒーの豆だった。',
    statReward: 'fun',
    statAmount: 5,
    probability: 0.15,
  },
  {
    id: 'bonus_gift_2',
    type: 'gift',
    title: '感謝の手紙',
    description: '机の上に一枚の紙。「昨日ありがとう」とだけ書かれていた。',
    statReward: 'kindness',
    statAmount: 8,
    probability: 0.12,
  },
  {
    id: 'bonus_gift_3',
    type: 'gift',
    title: '記憶の断片',
    description: 'ふと思い出した。子供の頃の宝物がどこかにあるはずだ。',
    statReward: 'memory',
    statAmount: 5,
    probability: 0.12,
  },
  {
    id: 'bonus_gift_4',
    type: 'gift',
    title: '言葉の種',
    description: 'ふと思いついた言葉。「今日の一言」としてメモしておこう。',
    statReward: 'articulation',
    statAmount: 5,
    probability: 0.12,
  },
  {
    id: 'bonus_gift_5',
    type: 'gift',
    title: '効率化のヒント',
    description: 'ふと気づいた。あの作業、もっと簡単にできるはずだ。',
    statReward: 'efficiency',
    statAmount: 5,
    probability: 0.10,
  },

  // === 特殊遭遇 ===
  {
    id: 'special_encounter_1',
    type: 'special_encounter',
    title: '間違い電話の物理学',
    description: '「君が探しているのは、ここじゃない。でも、並行世界（パラレルワールド）では既に見つかっているかもしれない」と言って電話が切れた。',
    statReward: 'memory',
    statAmount: 15,
    probability: 0.03,
  },
  {
    id: 'special_encounter_2',
    type: 'special_encounter',
    title: '夢の中の遺留品',
    description: '夢の中で古い友人と話していた。「忘れないでくれ。あの時、コインロッカーの鍵を預けたのは君だ」と言っていた気がする。',
    statReward: 'kindness',
    statAmount: 15,
    probability: 0.03,
  },
  {
    id: 'special_encounter_3',
    type: 'special_encounter',
    title: '路地裏の確率論者',
    description: '「おい、人生を賭けるには最高のオッズだぜ？」声をかけられたが、その姿を追おうとすると霧の向こうに消えた。',
    statReward: 'fun',
    statAmount: 15,
    probability: 0.03,
  },
  {
    id: 'special_encounter_4',
    type: 'special_encounter',
    title: '本屋の亡霊',
    description: '棚の間から見えたのは、死神のような目をした男だった。一瞬で消えたが、置かれた本には君の未来が書かれているようだった。',
    statReward: 'articulation',
    statAmount: 15,
    probability: 0.03,
  },
];

/**
 * 今日発生するランダムイベントを取得
 * @param triggeredToday 今日既に発生したイベントID
 * @returns 発生するイベント（なければnull）
 */
export const getRandomEvent = (triggeredToday: string[]): RandomEvent | null => {
  // 既に発生したイベントは除外
  const availableEvents = RANDOM_EVENTS.filter(event => !triggeredToday.includes(event.id));

  if (availableEvents.length === 0) {
    return null;
  }

  // 確率に基づいてイベント選択
  const randomValue = Math.random();

  for (const event of availableEvents) {
    if (randomValue < event.probability) {
      return event;
    }
  }

  return null;
};

/**
 * 指定されたキャラクターに関連するイベントを取得
 */
export const getEventsByCharacter = (characterId: CharacterId): RandomEvent[] => {
  return RANDOM_EVENTS.filter(event => event.characterId === characterId);
};

/**
 * イベントタイプ別に取得
 */
export const getEventsByType = (type: RandomEvent['type']): RandomEvent[] => {
  return RANDOM_EVENTS.filter(event => event.type === type);
};

/**
 * 緊急度別のイベントを取得（確率が高い順）
 */
export const getEmergencyEvents = (): RandomEvent[] => {
  return RANDOM_EVENTS
    .filter(event => event.type === 'emergency')
    .sort((a, b) => b.probability - a.probability);
};
