import { LeaderboardEntry } from '../types/game';

export interface LeaderboardRival {
  id: string;
  username: string;
  avatar: string;
  level: number;
  title: string;
  highestFloor: number;
  xpEarned: number;
  questionsCorrect: number;
  cosmeticsCollected: number;
}

export const SEEDED_RIVALS: LeaderboardRival[] = [
  {
    id: 'rival_1',
    username: 'NovaVanguard',
    avatar: '🧑‍🚀',
    level: 18,
    title: 'Grand Archon of Knowledge',
    highestFloor: 14,
    xpEarned: 8420,
    questionsCorrect: 142,
    cosmeticsCollected: 48,
  },
  {
    id: 'rival_2',
    username: 'Astraea_Sol',
    avatar: '🧙‍♀️',
    level: 16,
    title: 'Sage of the Nebula',
    highestFloor: 12,
    xpEarned: 7190,
    questionsCorrect: 128,
    cosmeticsCollected: 39,
  },
  {
    id: 'rival_3',
    username: 'Orion_Rider',
    avatar: '🥷',
    level: 14,
    title: 'Astral Champion',
    highestFloor: 11,
    xpEarned: 6350,
    questionsCorrect: 115,
    cosmeticsCollected: 34,
  },
  {
    id: 'rival_4',
    username: 'Cyber_Scribe',
    avatar: '🤖',
    level: 12,
    title: 'Legendary Scholar',
    highestFloor: 9,
    xpEarned: 5210,
    questionsCorrect: 98,
    cosmeticsCollected: 29,
  },
  {
    id: 'rival_5',
    username: 'Cosmic_Finch',
    avatar: '🦉',
    level: 11,
    title: 'Master Explorer',
    highestFloor: 8,
    xpEarned: 4680,
    questionsCorrect: 86,
    cosmeticsCollected: 25,
  },
  {
    id: 'rival_6',
    username: 'Quantum_Lex',
    avatar: '🧑‍🔬',
    level: 9,
    title: 'Void Gladiator',
    highestFloor: 7,
    xpEarned: 3940,
    questionsCorrect: 74,
    cosmeticsCollected: 21,
  },
  {
    id: 'rival_7',
    username: 'Solaris_Echo',
    avatar: '🦊',
    level: 8,
    title: 'Dungeon Crawler',
    highestFloor: 6,
    xpEarned: 3120,
    questionsCorrect: 60,
    cosmeticsCollected: 18,
  },
  {
    id: 'rival_8',
    username: 'Nebula_Wanderer',
    avatar: '🧝',
    level: 6,
    title: 'Knowledge Seeker',
    highestFloor: 4,
    xpEarned: 2450,
    questionsCorrect: 47,
    cosmeticsCollected: 14,
  },
  {
    id: 'rival_9',
    username: 'Pulsar_Pupil',
    avatar: '🧑‍💻',
    level: 4,
    title: 'Scholar',
    highestFloor: 3,
    xpEarned: 1650,
    questionsCorrect: 32,
    cosmeticsCollected: 9,
  },
];

export type LeaderboardCategory = 
  | 'highestFloor' 
  | 'level' 
  | 'xpEarned' 
  | 'questionsCorrect' 
  | 'cosmeticsCollected';

export function getRankedLeaderboard(
  category: LeaderboardCategory,
  playerData: {
    username: string;
    avatar: string;
    level: number;
    title: string;
    highestFloor: number;
    totalXpEarned: number;
    correctQuestions: number;
    cosmeticsCount: number;
  }
): { entries: LeaderboardEntry[]; playerRank: number } {
  const list = SEEDED_RIVALS.map(r => {
    let val = 0;
    if (category === 'highestFloor') val = r.highestFloor;
    else if (category === 'level') val = r.level;
    else if (category === 'xpEarned') val = r.xpEarned;
    else if (category === 'questionsCorrect') val = r.questionsCorrect;
    else if (category === 'cosmeticsCollected') val = r.cosmeticsCollected;
    return {
      username: r.username,
      avatar: r.avatar,
      level: r.level,
      title: r.title,
      value: val,
      isCurrentPlayer: false,
    };
  });

  // Insert player
  let playerVal = 0;
  if (category === 'highestFloor') playerVal = playerData.highestFloor;
  else if (category === 'level') playerVal = playerData.level;
  else if (category === 'xpEarned') playerVal = playerData.totalXpEarned;
  else if (category === 'questionsCorrect') playerVal = playerData.correctQuestions;
  else if (category === 'cosmeticsCollected') playerVal = playerData.cosmeticsCount;

  list.push({
    username: playerData.username,
    avatar: playerData.avatar,
    level: playerData.level,
    title: playerData.title,
    value: playerVal,
    isCurrentPlayer: true,
  });

  // Sort descending
  list.sort((a, b) => b.value - a.value);

  // Map to entries with ranks
  const entries: LeaderboardEntry[] = list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const playerRank = entries.find(e => e.isCurrentPlayer)?.rank || 1;

  return { entries, playerRank };
}
