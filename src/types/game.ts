export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type CosmeticCategory = 
  | 'hat' 
  | 'hair' 
  | 'mask' 
  | 'outfit' 
  | 'weapon' 
  | 'pet' 
  | 'trail' 
  | 'aura';

export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  rarity: Rarity;
  description: string;
  icon: string; // Emoji / glyph representation
  glowColor?: string; // Hex or CSS color
  shopPrice?: number; // In coins, undefined if chest exclusive
  isSpecial?: boolean; // Exactly 20 ultra rare special items (Legendary & Mythic)
}

export type Subject = 'Mathematics' | 'Science' | 'English';
export type Difficulty = 'Elementary' | 'Middle School' | 'High School' | 'College Prep';

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PlayerStats {
  totalQuestionsAnswered: number;
  correctQuestions: number;
  currentStreak: number;
  highestStreak: number;
  highestFloor: number;
  highestSurvivalWave: number;
  chestsOpened: number;
  bossesDefeated: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
  monstersDefeated: number;
}

export interface EquippedCosmetics {
  hat: string | null;
  hair: string | null;
  mask: string | null;
  outfit: string | null;
  weapon: string | null;
  pet: string | null;
  trail: string | null;
  aura: string | null;
}

export interface PlayerProfile {
  username: string;
  avatarBase: string; // Base avatar style
  level: number;
  xp: number;
  xpForNextLevel: number;
  coins: number;
  hp: number;
  maxHp: number;
  equippedTitle: string;
  equippedCosmetics: EquippedCosmetics;
}

export interface ConsumableInventory {
  healthPotion: number; // Restores 45 HP
  shieldScroll: number; // Negates next damage
  xpElixir: number;    // +50% XP for future questions
  cosmicKey: number;   // Opens any locked chest
  speedBoots: number;  // Increases speed for 5 minutes
  strengthSword: number; // Increases attack damage for 5 minutes
  hintPotion: number;  // Adds hints to questions and eliminates wrong answers
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'combat' | 'study' | 'collector' | 'dungeon';
  targetValue: number;
  currentValueKey: keyof PlayerStats | 'cosmeticsOwned' | 'level';
  rewardCoins: number;
  rewardXp: number;
  rewardTitle?: string;
}

export interface TitleDefinition {
  id: string;
  name: string;
  description: string;
  unlockCondition: string;
  rarity: Rarity;
  icon: string;
}

// Active Recall types
export interface Flashcard {
  id: string;
  front: string; // Question or Cloze sentence
  back: string;  // Answer or revealed blank
  clozeWords?: string[];
  reviewedCount: number;
  correctCount: number;
  lastReviewed?: number;
}

export interface RecallDeck {
  id: string;
  title: string;
  subject: Subject;
  description: string;
  sourceText?: string;
  cards: Flashcard[];
  createdAt: number;
}

// Dungeon types
export type RoomType = 'monster' | 'riddle' | 'treasure' | 'boss' | 'rest' | 'question_shrine';

export interface Monster {
  id: string;
  name: string;
  icon: string;
  hp: number;
  maxHp: number;
  attackPower: number;
  isBoss?: boolean;
  element: 'Void' | 'Stellar' | 'Solar' | 'Nebula' | 'Chrono';
}

export interface DungeonRoom {
  floorNumber: number;
  roomNumber: number;
  type: RoomType;
  title: string;
  description: string;
  monster?: Monster;
  chestReward?: { coins: number; item?: CosmeticItem };
  cleared: boolean;
}

// Trading types
export interface TradeItem {
  cosmeticId: string;
}

export interface TradeSession {
  tradeId: string;
  targetPlayer: {
    username: string;
    avatar: string;
    level: number;
    title: string;
  };
  myOfferedIds: string[];
  theirOfferedIds: string[];
  myConfirmed: boolean;
  theirConfirmed: boolean;
  status: 'draft' | 'pending_confirmation' | 'completed' | 'cancelled';
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  level: number;
  title: string;
  value: number;
  isCurrentPlayer?: boolean;
}
