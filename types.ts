export enum CharacterId {
  JACK = 'jack',
  HAL = 'hal',
  SAKI = 'saki',
  REN = 'ren',
  OPERATOR = 'operator',
  HIDDEN = 'hidden'
}

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  trait: string;
  stat: keyof UserStats;
  description: string;
  color: string;
  imageUrl: string;
  locked?: boolean; // 隠しキャラ用
  unlockCondition?: string; // 解放条件の説明
}

export interface UserStats {
  kindness: number;
  fun: number;
  memory: number;
  articulation: number;
  efficiency: number;
  streak: number;
  lastLoginDate: string; // YYYY-MM-DD format
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  characterId?: CharacterId;
  text: string;
  timestamp: number;
  isMission?: boolean;
}

export interface GameState {
  day: number;
  stats: UserStats;
  history: Message[];
  currentMission?: string;
  isMissionActive: boolean;
}

export interface MissionLogEntry {
  id: string;
  day: number;
  characterId: CharacterId;
  title: string;
  description?: string;
  completedAt: number;
  messages?: Message[];
  isSpecial?: boolean;
  isSeasonal?: boolean;
}

// ===== ランダムイベント =====
export interface RandomEvent {
  id: string;
  type: 'emergency' | 'bonus' | 'special_encounter' | 'gift';
  title: string;
  description: string;
  statReward?: keyof UserStats;
  statAmount?: number;
  characterId?: CharacterId;
  probability: number; // 0-1
}

export interface UserEvents {
  triggeredToday: string[]; // event IDs for current day
  lastEventCheck: string; // date string
}

// ===== 特別ミッション =====
export interface SpecialMission {
  id: string;
  requiredStat: keyof UserStats;
  requiredValue: number;
  title: string;
  description: string;
  characterId?: CharacterId;
  unlocked: boolean;
  completed: boolean;
}

export interface UserProgress {
  unlockedSpecialMissions: string[];
  completedSpecialMissions: string[];
}

// ===== 週末ストーリー分岐 =====
export type StoryBranch = CharacterId | 'solo';

export interface WeekEndChoice {
  week: number;
  selectedBranch: StoryBranch;
  completed: boolean;
}

// ===== サイドミッション =====
export interface SideMission {
  id: string;
  title: string;
  description: string;
  characterId: CharacterId;
  statReward: keyof UserStats;
  statAmount: number;
  expiresAt: number; // timestamp
  completed: boolean;
}

// ===== 季節イベント =====
export interface SeasonalEvent {
  id: string;
  name: string;
  startDate: string; // MM-DD
  endDate: string; // MM-DD
  specialStory: string;
  characterId?: CharacterId;
  themeColor: string;
  icon?: string;
}