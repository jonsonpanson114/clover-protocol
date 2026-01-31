export enum CharacterId {
  JACK = 'jack',
  HAL = 'hal',
  SAKI = 'saki',
  REN = 'ren'
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
}

export interface UserStats {
  kindness: number;
  fun: number;
  memory: number;
  articulation: number;
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
  completedAt: number;
}