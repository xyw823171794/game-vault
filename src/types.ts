
export type PlayStatus = 'Playing' | 'Completed' | 'Backlog' | 'Dropped' | 'Wishlist';

export const STATUS_LABELS: Record<PlayStatus, string> = {
  Playing: '进行中',
  Completed: '已通关',
  Backlog: '待玩',
  Dropped: '弃坑',
  Wishlist: '愿望单'
};

export interface Game {
  id: string;
  title: string;
  platform: string;
  status: PlayStatus;
  rating: number; // 0 to 10
  hoursPlayed: number;
  coverUrl?: string;
  releaseYear?: string;
  genres: string[];
  addedAt: string; // Record creation date
  lastPlayedAt?: string; // Actual last playtime (from Steam/Console)
  notes?: string;
}

export interface Stats {
  totalGames: number;
  completedGames: number;
  backlogGames: number;
  totalHours: number;
  platformDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
}

export const PLATFORMS = [
  'PC (Steam)',
  'PC (Epic)',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series X/S',
  'Xbox One',
  'Nintendo Switch',
  'Nintendo 3DS',
  '手游 (iOS)',
  '手游 (Android)',
  '怀旧/模拟器',
  '其他'
];

export const GENRES = [
  '动作', '冒险', 'RPG', '策略', '射击', '模拟', '解谜', '竞速', '体育', '恐怖', '独立游戏', '格斗', '肉鸽'
];

// Mock Data for Steam Import
export interface ImportedGame {
  title: string;
  hours: number;
  platform: string;
  img: string;
}
