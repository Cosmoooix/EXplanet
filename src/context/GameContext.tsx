import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PlayerProfile,
  PlayerStats,
  ConsumableInventory,
  CosmeticItem,
  CosmeticCategory,
  RecallDeck,
} from '../types/game';
import { COSMETICS_DATABASE } from '../data/cosmetics';
import { ACHIEVEMENTS_DATABASE } from '../data/achievements';
import { TITLES_DATABASE } from '../data/titles';
import { DEFAULT_DECKS } from '../data/defaultDecks';
import { sound } from '../utils/audio';

export interface OpenChestResult {
  rewardType: 'cosmetic' | 'consumable' | 'coins';
  item?: CosmeticItem;
  isDuplicate?: boolean;
  refundCoins?: number;
  consumableKey?: keyof ConsumableInventory;
  consumableName?: string;
  consumableIcon?: string;
  consumableCount?: number;
  coinsWon?: number;
  message: string;
}

interface GameContextType {
  player: PlayerProfile;
  stats: PlayerStats;
  consumables: ConsumableInventory;
  unlockedCosmetics: string[];
  unlockedTitles: string[];
  claimedAchievements: string[];
  answeredQuestionIds: string[];
  activeRecallDecks: RecallDeck[];
  soundEnabled: boolean;
  hasActiveShield: boolean;
  hasActiveXpElixir: boolean;
  hasActiveSpeedBoost: boolean;
  speedBoostSecondsRemaining: number;
  hasActiveAttackBoost: boolean;
  attackBoostSecondsRemaining: number;
  
  // Player actions
  gainXp: (amount: number) => { leveledUp: boolean; newLevel: number };
  gainCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  damagePlayer: (amount: number) => { died: boolean; actualDamage: number };
  healPlayer: (amount: number) => number;
  recordAnswer: (isCorrect: boolean, questionId: string) => void;
  recordMonsterDefeated: (isBoss?: boolean) => void;
  recordFloorCleared: (floor: number) => void;
  recordSurvivalWave: (wave: number) => void;
  
  // Cosmetics & Inventory
  unlockCosmetic: (id: string) => boolean;
  equipCosmetic: (category: CosmeticCategory, id: string | null) => void;
  buyCosmetic: (item: CosmeticItem) => boolean;
  buyConsumable: (type: keyof ConsumableInventory, price: number) => boolean;
  useConsumable: (type: keyof ConsumableInventory) => boolean;
  openChest: (chestType: 'Standard' | 'Mystic' | 'Cosmic', isFree?: boolean) => OpenChestResult | null;
  
  // Titles & Achievements
  equipTitle: (titleName: string) => void;
  claimAchievement: (achievementId: string) => boolean;
  
  // Active Recall
  saveDeck: (deck: RecallDeck) => void;
  deleteDeck: (deckId: string) => void;
  recordCardReview: (deckId: string, cardId: string, isCorrect: boolean) => void;
  
  // Trading
  executeTrade: (offeredIds: string[], receivedIds: string[]) => boolean;
  
  // Profile & System
  updateUsername: (username: string) => void;
  updateAvatarBase: (avatar: string) => void;
  toggleSound: () => void;
  resetProgress: () => void;
  exportSaveData: () => string;
  importSaveData: (json: string) => boolean;
}

const STORAGE_KEY = 'explanet_save_data_v1';

function calcXpForLevel(lvl: number): number {
  return Math.round(100 * Math.pow(lvl, 1.35));
}

export const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial states
  const [player, setPlayer] = useState<PlayerProfile>({
    username: 'StarScholar',
    avatarBase: '🧑‍🚀',
    level: 1,
    xp: 0,
    xpForNextLevel: calcXpForLevel(1),
    coins: 100,
    hp: 100,
    maxHp: 100,
    equippedTitle: 'Novice Explorer',
    equippedCosmetics: {
      hat: 'hat_novice_band',
      hair: 'hair_neat_sidepart',
      mask: null,
      outfit: 'outfit_cadet_suit',
      weapon: 'weapon_wooden_ruler',
      pet: 'pet_robot_cub',
      trail: null,
      aura: null,
    },
  });

  const [stats, setStats] = useState<PlayerStats>({
    totalQuestionsAnswered: 0,
    correctQuestions: 0,
    currentStreak: 0,
    highestStreak: 0,
    highestFloor: 0,
    highestSurvivalWave: 0,
    chestsOpened: 0,
    bossesDefeated: 0,
    totalXpEarned: 0,
    totalCoinsEarned: 100,
    monstersDefeated: 0,
  });

  const [consumables, setConsumables] = useState<ConsumableInventory>({
    healthPotion: 2,
    shieldScroll: 1,
    xpElixir: 1,
    cosmicKey: 0,
    speedBoots: 1,
    strengthSword: 1,
    hintPotion: 2,
  });

  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>([
    'hat_novice_band',
    'hair_neat_sidepart',
    'outfit_cadet_suit',
    'weapon_wooden_ruler',
    'pet_robot_cub',
  ]);

  const [unlockedTitles, setUnlockedTitles] = useState<string[]>([
    'Novice Explorer',
  ]);

  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [activeRecallDecks, setActiveRecallDecks] = useState<RecallDeck[]>(DEFAULT_DECKS);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active status buffs in current session
  const [hasActiveShield, setHasActiveShield] = useState<boolean>(false);
  const [hasActiveXpElixir, setHasActiveXpElixir] = useState<boolean>(false);

  // 5-minute active boost timers
  const [speedBoostUntil, setSpeedBoostUntil] = useState<number | null>(null);
  const [attackBoostUntil, setAttackBoostUntil] = useState<number | null>(null);
  const [speedBoostSecondsRemaining, setSpeedBoostSecondsRemaining] = useState<number>(0);
  const [attackBoostSecondsRemaining, setAttackBoostSecondsRemaining] = useState<number>(0);

  // Timer loop for 5-minute active boosts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (speedBoostUntil) {
        const rem = Math.max(0, Math.ceil((speedBoostUntil - now) / 1000));
        setSpeedBoostSecondsRemaining(rem);
        if (rem === 0) setSpeedBoostUntil(null);
      } else {
        setSpeedBoostSecondsRemaining(0);
      }

      if (attackBoostUntil) {
        const rem = Math.max(0, Math.ceil((attackBoostUntil - now) / 1000));
        setAttackBoostSecondsRemaining(rem);
        if (rem === 0) setAttackBoostUntil(null);
      } else {
        setAttackBoostSecondsRemaining(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [speedBoostUntil, attackBoostUntil]);

  const hasActiveSpeedBoost = speedBoostSecondsRemaining > 0;
  const hasActiveAttackBoost = attackBoostSecondsRemaining > 0;

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.player) setPlayer(data.player);
        if (data.stats) setStats(data.stats);
        if (data.consumables) setConsumables(data.consumables);
        if (data.unlockedCosmetics) setUnlockedCosmetics(data.unlockedCosmetics);
        if (data.unlockedTitles) setUnlockedTitles(data.unlockedTitles);
        if (data.claimedAchievements) setClaimedAchievements(data.claimedAchievements);
        if (data.answeredQuestionIds) setAnsweredQuestionIds(data.answeredQuestionIds);
        if (data.activeRecallDecks) setActiveRecallDecks(data.activeRecallDecks);
        if (typeof data.soundEnabled === 'boolean') {
          setSoundEnabled(data.soundEnabled);
          sound.setMuted(!data.soundEnabled);
        }
      }
    } catch (e) {
      console.warn('Failed to parse EXPlanet save data:', e);
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    try {
      const saveData = {
        player,
        stats,
        consumables,
        unlockedCosmetics,
        unlockedTitles,
        claimedAchievements,
        answeredQuestionIds,
        activeRecallDecks,
        soundEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('Failed to save EXPlanet data:', e);
    }
  }, [
    player,
    stats,
    consumables,
    unlockedCosmetics,
    unlockedTitles,
    claimedAchievements,
    answeredQuestionIds,
    activeRecallDecks,
    soundEnabled,
  ]);

  // Check achievements automatically whenever stats change
  useEffect(() => {
    ACHIEVEMENTS_DATABASE.forEach(ach => {
      if (claimedAchievements.includes(ach.id)) return;

      let currentVal = 0;
      if (ach.currentValueKey === 'cosmeticsOwned') {
        currentVal = unlockedCosmetics.length;
      } else if (ach.currentValueKey === 'level') {
        currentVal = player.level;
      } else {
        currentVal = stats[ach.currentValueKey as keyof PlayerStats] as number;
      }

      if (currentVal >= ach.targetValue) {
        // Auto unlock title associated if any
        if (ach.rewardTitle && !unlockedTitles.includes(ach.rewardTitle)) {
          setUnlockedTitles(prev => [...prev, ach.rewardTitle!]);
        }
      }
    });
  }, [stats, player.level, unlockedCosmetics.length, claimedAchievements, unlockedTitles]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      sound.setMuted(!next);
      return next;
    });
  };

  const gainXp = (amount: number) => {
    let finalAmount = amount;
    if (hasActiveXpElixir) {
      finalAmount = Math.round(amount * 1.5);
    }

    let leveledUp = false;
    let newLevel = player.level;

    setPlayer(prev => {
      let currentXp = prev.xp + finalAmount;
      let lvl = prev.level;
      let req = prev.xpForNextLevel;
      let bonusCoins = 0;
      let hpBonus = prev.maxHp;

      while (currentXp >= req) {
        currentXp -= req;
        lvl += 1;
        req = calcXpForLevel(lvl);
        leveledUp = true;
        bonusCoins += lvl * 25;
        hpBonus += 10;
      }

      newLevel = lvl;

      if (leveledUp) {
        sound.play('levelUp');
      }

      return {
        ...prev,
        level: lvl,
        xp: currentXp,
        xpForNextLevel: req,
        coins: prev.coins + bonusCoins,
        maxHp: hpBonus,
        hp: hpBonus, // Refill on level up
      };
    });

    setStats(prev => ({
      ...prev,
      totalXpEarned: prev.totalXpEarned + finalAmount,
    }));

    return { leveledUp, newLevel };
  };

  const gainCoins = (amount: number) => {
    sound.play('coin');
    setPlayer(prev => ({ ...prev, coins: prev.coins + amount }));
    setStats(prev => ({ ...prev, totalCoinsEarned: prev.totalCoinsEarned + amount }));
  };

  const spendCoins = (amount: number): boolean => {
    if (player.coins < amount) return false;
    setPlayer(prev => ({ ...prev, coins: prev.coins - amount }));
    return true;
  };

  const damagePlayer = (amount: number): { died: boolean; actualDamage: number } => {
    if (hasActiveShield) {
      setHasActiveShield(false);
      sound.play('hit');
      return { died: false, actualDamage: 0 };
    }

    const actual = Math.min(player.hp, amount);
    const remaining = player.hp - actual;
    const died = remaining <= 0;

    setPlayer(prev => ({
      ...prev,
      hp: Math.max(0, remaining),
    }));

    if (died) {
      sound.play('defeat');
    } else {
      sound.play('hit');
    }

    return { died, actualDamage: actual };
  };

  const healPlayer = (amount: number): number => {
    const missing = player.maxHp - player.hp;
    const healed = Math.min(missing, amount);
    setPlayer(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healed),
    }));
    sound.play('potion');
    return healed;
  };

  const recordAnswer = (isCorrect: boolean, questionId: string) => {
    if (!answeredQuestionIds.includes(questionId)) {
      setAnsweredQuestionIds(prev => [...prev, questionId]);
    }

    setStats(prev => {
      const nextStreak = isCorrect ? prev.currentStreak + 1 : 0;
      const highestStreak = Math.max(prev.highestStreak, nextStreak);
      return {
        ...prev,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
        correctQuestions: isCorrect ? prev.correctQuestions + 1 : prev.correctQuestions,
        currentStreak: nextStreak,
        highestStreak: highestStreak,
      };
    });

    if (isCorrect) {
      sound.play('correct');
      gainXp(25);
      gainCoins(10);
    } else {
      sound.play('wrong');
    }
  };

  const recordMonsterDefeated = (isBoss: boolean = false) => {
    setStats(prev => ({
      ...prev,
      monstersDefeated: prev.monstersDefeated + 1,
      bossesDefeated: isBoss ? prev.bossesDefeated + 1 : prev.bossesDefeated,
    }));
  };

  const recordFloorCleared = (floor: number) => {
    setStats(prev => ({
      ...prev,
      highestFloor: Math.max(prev.highestFloor, floor),
    }));
  };

  const recordSurvivalWave = (wave: number) => {
    setStats(prev => ({
      ...prev,
      highestSurvivalWave: Math.max(prev.highestSurvivalWave, wave),
    }));
  };

  const unlockCosmetic = (id: string): boolean => {
    if (unlockedCosmetics.includes(id)) return false;
    setUnlockedCosmetics(prev => [...prev, id]);
    return true;
  };

  const equipCosmetic = (category: CosmeticCategory, id: string | null) => {
    sound.play('click');
    setPlayer(prev => ({
      ...prev,
      equippedCosmetics: {
        ...prev.equippedCosmetics,
        [category]: id,
      },
    }));
  };

  // Cosmetics are strictly NON-PURCHASABLE per instructions; only discoverable in chests & achievements
  const buyCosmetic = (_item: CosmeticItem): boolean => {
    return false;
  };

  const buyConsumable = (type: keyof ConsumableInventory, price: number): boolean => {
    if (player.coins < price) return false;
    spendCoins(price);
    setConsumables(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    sound.play('coin');
    return true;
  };

  const useConsumable = (type: keyof ConsumableInventory): boolean => {
    if (!consumables[type] || consumables[type] <= 0) return false;

    if (type === 'healthPotion') {
      if (player.hp >= player.maxHp) return false;
      healPlayer(45);
    } else if (type === 'shieldScroll') {
      if (hasActiveShield) return false;
      setHasActiveShield(true);
      sound.play('potion');
    } else if (type === 'xpElixir') {
      if (hasActiveXpElixir) return false;
      setHasActiveXpElixir(true);
      sound.play('potion');
    } else if (type === 'speedBoots') {
      // 5-minute movement speed boost
      setSpeedBoostUntil(Date.now() + 5 * 60 * 1000);
      setSpeedBoostSecondsRemaining(300);
      sound.play('potion');
    } else if (type === 'strengthSword') {
      // 5-minute attack damage boost (+50 DMG)
      setAttackBoostUntil(Date.now() + 5 * 60 * 1000);
      setAttackBoostSecondsRemaining(300);
      sound.play('victory');
    } else if (type === 'hintPotion') {
      // Question hint lifeline potion
      sound.play('potion');
    } else if (type === 'cosmicKey') {
      sound.play('click');
    }

    setConsumables(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) - 1),
    }));
    return true;
  };

  const openChest = (
    chestType: 'Standard' | 'Mystic' | 'Cosmic',
    isFree: boolean = false
  ): OpenChestResult | null => {
    // Exact requested pricing: Standard 2,500, Mystic 3,500, Cosmic 5,000
    const costMap = {
      Standard: 2500,
      Mystic: 3500,
      Cosmic: 5000,
    };

    if (!isFree) {
      if (player.coins < costMap[chestType]) return null;
      spendCoins(costMap[chestType]);
    }

    sound.play('chestOpen');

    const specialPool = COSMETICS_DATABASE.filter(c => c.isSpecial);
    const standardPool = COSMETICS_DATABASE.filter(c => !c.isSpecial);

    // Repeated rewards & non-cosmetic supplies:
    // Cosmetics are much rarer to make them feel prestigious!
    // Standard: 20% chance for cosmetic, 80% chance for supplies/coins
    // Mystic: 32% chance for cosmetic, 68% chance for supplies/coins
    // Cosmic: 42% chance for cosmetic, 58% chance for supplies/coins
    const cosmeticChance = chestType === 'Standard' ? 20 : chestType === 'Mystic' ? 32 : 42;
    const isCosmeticDrop = Math.random() * 100 < cosmeticChance;

    if (!isCosmeticDrop) {
      setStats(prev => ({ ...prev, chestsOpened: prev.chestsOpened + 1 }));
      const supplyRoll = Math.random() * 100;

      if (supplyRoll < 30) {
        // Swift Boots!
        const count = chestType === 'Cosmic' ? 2 : 1;
        setConsumables(prev => ({ ...prev, speedBoots: (prev.speedBoots || 0) + count }));
        return {
          rewardType: 'consumable',
          consumableKey: 'speedBoots',
          consumableName: 'Swift Boots (5-Min Speed Surge)',
          consumableIcon: '👢',
          consumableCount: count,
          message: `Unboxed ${count}x Swift Boots! Move faster than any chasing dungeon monster for 5 minutes!`,
        };
      } else if (supplyRoll < 55) {
        // Warrior's Blade!
        const count = chestType === 'Cosmic' ? 2 : 1;
        setConsumables(prev => ({ ...prev, strengthSword: (prev.strengthSword || 0) + count }));
        return {
          rewardType: 'consumable',
          consumableKey: 'strengthSword',
          consumableName: "Warrior's Blade (5-Min +50 ATK)",
          consumableIcon: '⚔️',
          consumableCount: count,
          message: `Unboxed ${count}x Warrior's Blade! Boosts your attack power by +50 DMG for 5 minutes!`,
        };
      } else if (supplyRoll < 75) {
        // Scholar's Hint Potion!
        const count = chestType === 'Cosmic' ? 3 : chestType === 'Mystic' ? 2 : 1;
        setConsumables(prev => ({ ...prev, hintPotion: (prev.hintPotion || 0) + count }));
        return {
          rewardType: 'consumable',
          consumableKey: 'hintPotion',
          consumableName: "Scholar's Hint Potion",
          consumableIcon: '💡',
          consumableCount: count,
          message: `Unboxed ${count}x Scholar's Hint Potion! Reveals clues and eliminates wrong choices in questions!`,
        };
      } else if (supplyRoll < 90) {
        // Vitality Potion & Shield Scroll
        const count = chestType === 'Cosmic' ? 3 : 2;
        setConsumables(prev => ({
          ...prev,
          healthPotion: (prev.healthPotion || 0) + count,
          shieldScroll: (prev.shieldScroll || 0) + 1,
        }));
        return {
          rewardType: 'consumable',
          consumableKey: 'healthPotion',
          consumableName: `Vitality & Shield Pack (${count}x Potions + 1x Shield)`,
          consumableIcon: '🧪',
          consumableCount: count,
          message: `Unboxed expedition recovery pack: ${count}x Potions and 1x Shield Scroll!`,
        };
      } else {
        // Ancient Coin Cache refund
        const coinsWon =
          chestType === 'Cosmic'
            ? 1200 + Math.floor(Math.random() * 800)
            : chestType === 'Mystic'
            ? 700 + Math.floor(Math.random() * 500)
            : 350 + Math.floor(Math.random() * 300);
        gainCoins(coinsWon);
        return {
          rewardType: 'coins',
          coinsWon,
          message: `Uncovered an Ancient Vault Cache containing +${coinsWon} Coins!`,
        };
      }
    }

    // Cosmetic Drop: Special relics feel IMPOSSIBLE to acquire!
    let selected: CosmeticItem;
    const relicRoll = Math.random() * 100;

    if (chestType === 'Standard') {
      // 0.05% Special (virtually impossible!), 1% Epic, 9% Rare, 35% Uncommon, 54.95% Common
      if (relicRoll < 0.05 && specialPool.length > 0) {
        selected = specialPool[Math.floor(Math.random() * specialPool.length)];
      } else if (relicRoll < 1.05) {
        const pool = standardPool.filter(c => c.rarity === 'Epic');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else if (relicRoll < 10.05) {
        const pool = standardPool.filter(c => c.rarity === 'Rare');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else if (relicRoll < 45.05) {
        const pool = standardPool.filter(c => c.rarity === 'Uncommon');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const pool = standardPool.filter(c => c.rarity === 'Common');
        selected = pool[Math.floor(Math.random() * pool.length)];
      }
    } else if (chestType === 'Mystic') {
      // 0.25% Special (almost impossible), 6% Epic, 28% Rare, 45% Uncommon, 20.75% Common
      if (relicRoll < 0.25 && specialPool.length > 0) {
        selected = specialPool[Math.floor(Math.random() * specialPool.length)];
      } else if (relicRoll < 6.25) {
        const pool = standardPool.filter(c => c.rarity === 'Epic');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else if (relicRoll < 34.25) {
        const pool = standardPool.filter(c => c.rarity === 'Rare');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else if (relicRoll < 79.25) {
        const pool = standardPool.filter(c => c.rarity === 'Uncommon');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const pool = standardPool.filter(c => c.rarity === 'Common');
        selected = pool[Math.floor(Math.random() * pool.length)];
      }
    } else {
      // Cosmic Chest:
      // 0.8% Special Relic (extremely low / impossible feel), 25% Epic, 45% Rare, 29.2% Uncommon
      if (relicRoll < 0.8 && specialPool.length > 0) {
        selected = specialPool[Math.floor(Math.random() * specialPool.length)];
      } else if (relicRoll < 25.8) {
        const pool = standardPool.filter(c => c.rarity === 'Epic');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else if (relicRoll < 70.8) {
        const pool = standardPool.filter(c => c.rarity === 'Rare');
        selected = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const pool = standardPool.filter(c => c.rarity === 'Uncommon');
        selected = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    if (!selected) {
      selected = standardPool[0];
    }

    const isDuplicate = unlockedCosmetics.includes(selected.id);
    let refundCoins = 0;

    if (isDuplicate) {
      const refundMap: Record<string, number> = {
        Common: 60,
        Uncommon: 120,
        Rare: 250,
        Epic: 500,
        Legendary: 1000,
        Mythic: 2000,
      };
      refundCoins = refundMap[selected.rarity] || 60;
      gainCoins(refundCoins);
    } else {
      unlockCosmetic(selected.id);
    }

    setStats(prev => ({
      ...prev,
      chestsOpened: prev.chestsOpened + 1,
    }));

    return {
      rewardType: 'cosmetic',
      item: selected,
      isDuplicate,
      refundCoins,
      message: isDuplicate
        ? `Duplicate Cosmetic: Compensated with +${refundCoins} Coins!`
        : `Unlocked New Cosmetic Relic: ${selected.name}!`,
    };
  };

  const equipTitle = (titleName: string) => {
    sound.play('click');
    setPlayer(prev => ({ ...prev, equippedTitle: titleName }));
  };

  const claimAchievement = (achievementId: string): boolean => {
    if (claimedAchievements.includes(achievementId)) return false;
    const ach = ACHIEVEMENTS_DATABASE.find(a => a.id === achievementId);
    if (!ach) return false;

    setClaimedAchievements(prev => [...prev, achievementId]);
    gainCoins(ach.rewardCoins);
    gainXp(ach.rewardXp);
    if (ach.rewardTitle && !unlockedTitles.includes(ach.rewardTitle)) {
      setUnlockedTitles(prev => [...prev, ach.rewardTitle!]);
    }
    sound.play('victory');
    return true;
  };

  const saveDeck = (deck: RecallDeck) => {
    setActiveRecallDecks(prev => {
      const idx = prev.findIndex(d => d.id === deck.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = deck;
        return updated;
      }
      return [deck, ...prev];
    });
  };

  const deleteDeck = (deckId: string) => {
    setActiveRecallDecks(prev => prev.filter(d => d.id !== deckId));
  };

  const recordCardReview = (deckId: string, cardId: string, isCorrect: boolean) => {
    setActiveRecallDecks(prev =>
      prev.map(d => {
        if (d.id !== deckId) return d;
        return {
          ...d,
          cards: d.cards.map(c => {
            if (c.id !== cardId) return c;
            return {
              ...c,
              reviewedCount: c.reviewedCount + 1,
              correctCount: isCorrect ? c.correctCount + 1 : c.correctCount,
              lastReviewed: Date.now(),
            };
          }),
        };
      })
    );

    gainXp(15);
    gainCoins(isCorrect ? 5 : 1);
    if (isCorrect) sound.play('correct');
    else sound.play('wrong');
  };

  const executeTrade = (offeredIds: string[], receivedIds: string[]): boolean => {
    // Validate that player owns offered items
    for (const id of offeredIds) {
      if (!unlockedCosmetics.includes(id)) {
        return false;
      }
    }

    // Remove offered from player inventory (unequip if currently equipped)
    setUnlockedCosmetics(prev => {
      const remaining = prev.filter(id => !offeredIds.includes(id));
      // Add received items (deduplicated)
      const combined = [...remaining];
      for (const recId of receivedIds) {
        if (!combined.includes(recId)) {
          combined.push(recId);
        }
      }
      return combined;
    });

    // Unequip any offered item if equipped
    setPlayer(prev => {
      const updatedEquip = { ...prev.equippedCosmetics };
      (Object.keys(updatedEquip) as CosmeticCategory[]).forEach(cat => {
        if (updatedEquip[cat] && offeredIds.includes(updatedEquip[cat]!)) {
          updatedEquip[cat] = null;
        }
      });
      return { ...prev, equippedCosmetics: updatedEquip };
    });

    sound.play('coin');
    return true;
  };

  const updateUsername = (name: string) => {
    setPlayer(prev => ({ ...prev, username: name.trim() || 'Explorer' }));
  };

  const updateAvatarBase = (avatar: string) => {
    setPlayer(prev => ({ ...prev, avatarBase: avatar }));
  };

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const exportSaveData = (): string => {
    const data = {
      player,
      stats,
      consumables,
      unlockedCosmetics,
      unlockedTitles,
      claimedAchievements,
      answeredQuestionIds,
      activeRecallDecks,
    };
    return JSON.stringify(data, null, 2);
  };

  const importSaveData = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.player) setPlayer(parsed.player);
      if (parsed.stats) setStats(parsed.stats);
      if (parsed.consumables) setConsumables(parsed.consumables);
      if (parsed.unlockedCosmetics) setUnlockedCosmetics(parsed.unlockedCosmetics);
      if (parsed.unlockedTitles) setUnlockedTitles(parsed.unlockedTitles);
      if (parsed.claimedAchievements) setClaimedAchievements(parsed.claimedAchievements);
      if (parsed.activeRecallDecks) setActiveRecallDecks(parsed.activeRecallDecks);
      sound.play('levelUp');
      return true;
    } catch {
      return false;
    }
  };

  return (
    <GameContext.Provider
      value={{
        player,
        stats,
        consumables,
        unlockedCosmetics,
        unlockedTitles,
        claimedAchievements,
        answeredQuestionIds,
        activeRecallDecks,
        soundEnabled,
        hasActiveShield,
        hasActiveXpElixir,
        hasActiveSpeedBoost,
        speedBoostSecondsRemaining,
        hasActiveAttackBoost,
        attackBoostSecondsRemaining,
        gainXp,
        gainCoins,
        spendCoins,
        damagePlayer,
        healPlayer,
        recordAnswer,
        recordMonsterDefeated,
        recordFloorCleared,
        recordSurvivalWave,
        unlockCosmetic,
        equipCosmetic,
        buyCosmetic,
        buyConsumable,
        useConsumable,
        openChest,
        equipTitle,
        claimAchievement,
        saveDeck,
        deleteDeck,
        recordCardReview,
        executeTrade,
        updateUsername,
        updateAvatarBase,
        toggleSound,
        resetProgress,
        exportSaveData,
        importSaveData,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
