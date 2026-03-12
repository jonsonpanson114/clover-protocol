import { SeasonalEvent, CharacterId } from './types';

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  // === クリスマス ===
  {
    id: 'christmas',
    name: '聖夜の奇跡',
    startDate: '12-20',
    endDate: '12-25',
    specialStory: 'この時期になると、ジャックが妙に感傷的になる。「復讐なんてする必要ない……今日は皆が幸せならいい」と泣きそうだ。',
    characterId: CharacterId.JACK,
    themeColor: 'bg-red-100',
    icon: '🎄',
  },

  // === 正月 ===
  {
    id: 'new_year',
    name: '初日の出',
    startDate: '01-01',
    endDate: '01-03',
    specialStory: '新年の朝、ハルが「今年こそは最高の銀行強盗をやるぜ」とニヤリと笑った。',
    characterId: CharacterId.HAL,
    themeColor: 'bg-amber-100',
    icon: '🎍',
  },

  // === バレンタインデー ===
  {
    id: 'valentine',
    name: '愛の告白日',
    startDate: '02-14',
    endDate: '02-14',
    specialStory: 'レンが「愛なんて言葉、存在しないのかい？ ……いや、君の目を見ると否定できないな」と珍しく素直だ。',
    characterId: CharacterId.REN,
    themeColor: 'bg-pink-100',
    icon: '💌',
  },

  // === 伊坂幸太郎の誕生日 ===
  {
    id: 'isaka_birthday',
    name: '作者の誕生日',
    startDate: '05-25',
    endDate: '05-25',
    specialStory: 'この日は特別な日だ。「君の人生という物語、誰が書いている？ ……君自身だよ」と誰かの声が聞こえた気がする。',
    characterId: CharacterId.SAKI,
    themeColor: 'bg-emerald-100',
    icon: '🎂',
  },

  // === ハロウィン ===
  {
    id: 'halloween',
    name: '不思議な夜',
    startDate: '10-31',
    endDate: '10-31',
    specialStory: 'ハロウィン限定、「隠しキャラ」が姿を現すという噂がある。',
    characterId: CharacterId.HIDDEN,
    themeColor: 'bg-orange-200',
    icon: '🎃',
  },

  // === 梅雨 ===
  {
    id: 'rainy_season',
    name: '雨季の物語',
    startDate: '06-15',
    endDate: '07-15',
    specialStory: '「雨の日には、特別な物語が生まれるんだよ」とサキが窓の外を眺めている。',
    characterId: CharacterId.SAKI,
    themeColor: 'bg-indigo-100',
    icon: '🌧️',
  },

  // === 夏至 ===
  {
    id: 'summer_solstice',
    name: '最長の夜明け',
    startDate: '06-20',
    endDate: '06-22',
    specialStory: '一年で最も昼が長い日。オペレーターが「日光照射時間が最大だ。処理効率を最大化する時だ」と語る。',
    characterId: CharacterId.OPERATOR,
    themeColor: 'bg-cyan-100',
    icon: '☀️',
  },

  // === 冬至 ===
  {
    id: 'winter_solstice',
    name: '最長の夜',
    startDate: '12-21',
    endDate: '12-23',
    specialStory: '一年で最も夜が長い日。何かが起きる予感がする。',
    characterId: CharacterId.HIDDEN,
    themeColor: 'bg-slate-200',
    icon: '🌙',
  },
];

/**
 * 現在の季節イベントを取得
 * @returns アクティブな季節イベント（なければnull）
 */
export const getActiveSeasonalEvent = (): SeasonalEvent | null => {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const today = `${month}-${day}`;

  return SEASONAL_EVENTS.find(event => {
    const start = event.startDate;
    const end = event.endDate;
    return today >= start && today <= end;
  }) || null;
};

/**
 * イベント期間までの残り日数を取得
 */
export const getDaysUntilEvent = (event: SeasonalEvent): number => {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [startMonth, startDay] = event.startDate.split('-').map(Number);
  const eventDate = new Date(currentYear, startMonth - 1, startDay);

  if (eventDate < now) {
    // 今年のイベントは終了済み、来年を計算
    return getDaysUntilEvent({ ...event, startDate: event.startDate });
  }

  const diffTime = eventDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 期間中のイベントを全て取得
 */
export const getAllActiveEvents = (): SeasonalEvent[] => {
  return SEASONAL_EVENTS.filter(event => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const today = `${month}-${day}`;
    return today >= event.startDate && today <= event.endDate;
  });
};
