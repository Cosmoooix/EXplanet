import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getRandomQuestion } from '../data/questions';
import { Question, Subject, Difficulty, RoomType } from '../types/game';
import { DungeonEngine, GameEntity } from '../game/DungeonEngine';
import { RewardModal, RewardData } from './RewardModal';
import { PixelSpriteView } from '../game/PixelSpriteView';
import { sound } from '../utils/audio';
import {
  Sword,
  Shield,
  Heart,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Gift,
  HelpCircle,
  Flame,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Compass,
  ArrowRight,
  Hand,
  Lock,
  DoorOpen,
  Timer,
  Skull,
  ShieldAlert,
} from 'lucide-react';

interface InfiniteDungeonProps {
  onBackToDashboard: () => void;
}

interface BossIntroData {
  name: string;
  rank: 'S-CLASS FLOOR SOVEREIGN' | 'A-CLASS ANCIENT MINI-BOSS';
  subtitle: string;
  lore: string;
  spriteType: 'boss_dragon' | 'mini_boss_golem';
  hp: number;
  atk: number;
  monsterEntity: GameEntity;
}

export const InfiniteDungeon: React.FC<InfiniteDungeonProps> = ({ onBackToDashboard }) => {
  const {
    player,
    damagePlayer,
    healPlayer,
    gainCoins,
    gainXp,
    recordAnswer,
    recordMonsterDefeated,
    recordFloorCleared,
    answeredQuestionIds,
    consumables,
    useConsumable,
    hasActiveShield,
    openChest,
    hasActiveSpeedBoost,
    speedBoostSecondsRemaining,
    hasActiveAttackBoost,
    attackBoostSecondsRemaining,
  } = useGame();

  const [floor, setFloor] = useState<number>(1);
  const [roomIndex, setRoomIndex] = useState<number>(1);
  const totalRoomsPerFloor = 5;

  const [currentRoomType, setCurrentRoomType] = useState<RoomType>('monster');
  const [combatMonster, setCombatMonster] = useState<GameEntity | null>(null);
  const [activeBattleMonsterId, setActiveBattleMonsterId] = useState<string | null>(null);

  // Door Lock Question State (ALL doors have questions!)
  const [activeDoor, setActiveDoor] = useState<GameEntity | null>(null);
  const [doorQuestion, setDoorQuestion] = useState<Question | null>(null);
  const [selectedDoorAnswer, setSelectedDoorAnswer] = useState<number | null>(null);
  const [isDoorAnswerCorrect, setIsDoorAnswerCorrect] = useState<boolean | null>(null);
  const [showDoorExplanation, setShowDoorExplanation] = useState<boolean>(false);
  const [doorEliminatedIndices, setDoorEliminatedIndices] = useState<number[]>([]);
  const [doorHintActive, setDoorHintActive] = useState<boolean>(false);

  // Normal Combat Question State & Active Countdown Timer
  const QUESTION_TIME_LIMIT = 15; // 15 seconds per combat question
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [combatTimeLeft, setCombatTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [combatEliminatedIndices, setCombatEliminatedIndices] = useState<number[]>([]);
  const [combatHintActive, setCombatHintActive] = useState<boolean>(false);

  // Subject and Difficulty Filters
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'All'>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');

  // Rewards Pop-up Modal State
  const [activeReward, setActiveReward] = useState<RewardData | null>(null);
  const [pendingRoomAdvance, setPendingRoomAdvance] = useState<(() => void) | null>(null);

  // Boss & Mini-Boss Introduction Cutscene Modal State
  const [bossIntro, setBossIntro] = useState<BossIntroData | null>(null);
  const seenBossIntrosRef = useRef<Set<string>>(new Set());

  // Combat animation visual state
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [isHit, setIsHit] = useState<boolean>(false);
  const [combatLog, setCombatLog] = useState<string>('Select the correct answer before the timer expires!');
  const [notification, setNotification] = useState<string | null>(null);
  const [npcDialog, setNpcDialog] = useState<string | null>(null);

  // Setup room type when floor/roomIndex changes
  useEffect(() => {
    if (roomIndex === totalRoomsPerFloor) {
      setCurrentRoomType('boss');
    } else if (roomIndex === 3) {
      setCurrentRoomType('monster'); // Mini-boss pit
    } else if (roomIndex === 2) {
      setCurrentRoomType('treasure');
    } else if (roomIndex === 4) {
      setCurrentRoomType('rest');
    } else {
      setCurrentRoomType('monster');
    }
    setCombatMonster(null);
    setActiveDoor(null);
  }, [floor, roomIndex]);

  // Load a new educational combat question
  const loadCombatQuestion = () => {
    let effectiveDiff = difficultyFilter;
    if (effectiveDiff === 'All') {
      if (floor <= 2) effectiveDiff = 'Elementary';
      else if (floor <= 4) effectiveDiff = 'Middle School';
      else if (floor <= 7) effectiveDiff = 'High School';
      else effectiveDiff = 'College Prep';
    }

    const { question } = getRandomQuestion(answeredQuestionIds, subjectFilter, effectiveDiff);
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsAnswerCorrect(null);
    setCombatTimeLeft(QUESTION_TIME_LIMIT);
    setCombatEliminatedIndices([]);
    setCombatHintActive(false);
  };

  // Scholar's Hint Potion: eliminates 2 incorrect options in Combat
  const handleUseCombatHintPotion = () => {
    if (consumables.hintPotion <= 0 || !currentQuestion || combatHintActive || selectedAnswer !== null) return;
    const ok = useConsumable('hintPotion');
    if (ok) {
      sound.play('potion');
      const wrongIndices = currentQuestion.options
        .map((_, idx) => idx)
        .filter(idx => idx !== currentQuestion.correctIndex);
      const toEliminate = [...wrongIndices].sort(() => 0.5 - Math.random()).slice(0, 2);
      setCombatEliminatedIndices(toEliminate);
      setCombatHintActive(true);
      setCombatLog('🧪 Scholar\'s Hint Potion dissolved 2 false answers! 50/50 lifeline active!');
    }
  };

  // Scholar's Hint Potion: eliminates 2 incorrect options in Door Cipher
  const handleUseDoorHintPotion = () => {
    if (consumables.hintPotion <= 0 || !doorQuestion || doorHintActive || selectedDoorAnswer !== null) return;
    const ok = useConsumable('hintPotion');
    if (ok) {
      sound.play('potion');
      const wrongIndices = doorQuestion.options
        .map((_, idx) => idx)
        .filter(idx => idx !== doorQuestion.correctIndex);
      const toEliminate = [...wrongIndices].sort(() => 0.5 - Math.random()).slice(0, 2);
      setDoorEliminatedIndices(toEliminate);
      setDoorHintActive(true);
    }
  };

  // Active Combat Question Timer Loop
  useEffect(() => {
    if (!combatMonster || !currentQuestion || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setCombatTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Question timed out! Monster retaliates!
          handleCombatTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [combatMonster, currentQuestion, selectedAnswer]);

  // Handle Question Timeout Penalty
  const handleCombatTimeout = () => {
    if (!combatMonster || !currentQuestion) return;

    sound.play('wrong');
    setIsHit(true);
    setSelectedAnswer(-1); // Marks timeout
    setIsAnswerCorrect(false);
    setShowExplanation(true);
    recordAnswer(false, currentQuestion.id);

    setTimeout(() => {
      setIsHit(false);
      const monsterAtk = combatMonster.atk ?? 15;
      const { died } = damagePlayer(monsterAtk);

      if (died) {
        setCombatLog(`Fallen in battle against ${combatMonster.name}. Recharging at hub.`);
      } else {
        setCombatLog(
          hasActiveShield
            ? `Shield Scroll absorbed incoming attack! (Time Expired)`
            : `Time Expired! ${combatMonster.name} struck you for ${monsterAtk} HP!`
        );
      }
    }, 300);
  };

  // Called when a Boss or Mini-Boss spawns on the map
  const handleBossSpawned = (bossEntity: GameEntity) => {
    const introKey = `f${floor}_r${roomIndex}_${bossEntity.id}`;
    if (seenBossIntrosRef.current.has(introKey)) return;
    seenBossIntrosRef.current.add(introKey);

    sound.play('wrong'); // Dramatic alert sound

    if (bossEntity.isBoss) {
      setBossIntro({
        name: bossEntity.name,
        rank: 'S-CLASS FLOOR SOVEREIGN',
        subtitle: `Ancient Guardian of Floor ${floor}`,
        lore: 'Its molten obsidian scales burn with corrupted cosmic void. Exit portals are sealed by its dark ward until defeated in battle!',
        spriteType: 'boss_dragon',
        hp: bossEntity.hp ?? 250,
        atk: bossEntity.atk ?? 30,
        monsterEntity: bossEntity,
      });
    } else if (bossEntity.isMiniBoss) {
      setBossIntro({
        name: bossEntity.name,
        rank: 'A-CLASS ANCIENT MINI-BOSS',
        subtitle: `Sentry of the Sunken Pit (Floor ${floor})`,
        lore: 'Constructed from primordial starstones to test scholar endurance. It relentlessly stalks all intruders—destroy it to unlock the chamber gates!',
        spriteType: 'mini_boss_golem',
        hp: bossEntity.hp ?? 140,
        atk: bossEntity.atk ?? 20,
        monsterEntity: bossEntity,
      });
    }
  };

  // Called when player engages a monster on the 2D pixel map
  const handleEngageMonster = (monster: GameEntity) => {
    sound.play('attack');
    setCombatMonster(monster);
    loadCombatQuestion();
    setCombatLog(`Engaged ${monster.name}! Answer before the 15s timer expires!`);
  };

  // Called when dismissing boss intro scene: player is REQUIRED to fight them!
  const handleEngageBossFromIntro = () => {
    if (!bossIntro) return;
    const monster = bossIntro.monsterEntity;
    setBossIntro(null);
    handleEngageMonster(monster);
  };

  // Called when player opens a chest on the 2D map
  const handleOpenChest = (chest: GameEntity) => {
    sound.play('chestOpen');
    const res = openChest('Standard', true); // Free dungeon chest reward
    if (res) {
      setPendingRoomAdvance(null);
      setActiveReward({
        title: res.isDuplicate ? 'Duplicate Compensation!' : 'Cosmetic Unlocked!',
        subtitle: 'Dungeon Cache Discovery',
        cosmetic: res.item,
        isDuplicate: res.isDuplicate,
        refundCoins: res.refundCoins,
        coins: res.refundCoins > 0 ? res.refundCoins : 20,
        xp: 40,
      });
    }
  };

  // Called when player attempts to pass ANY door on the 2D map
  const handleAttemptDoor = (door: GameEntity) => {
    // If the door is sealed by an undefeated Boss or Mini-Boss:
    if (door.isSealedByBoss) {
      sound.play('wrong');
      setNotification('🔒 Arcane Barrier Active! You MUST defeat the chamber Boss to unlock the exit portals!');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    sound.play('click');
    setActiveDoor(door);

    // Pick question matching door's subject specialization
    const subject = door.doorSubject && door.doorSubject !== 'Mixed' ? door.doorSubject : 'All';
    let effectiveDiff = difficultyFilter;
    if (effectiveDiff === 'All') {
      if (floor <= 2) effectiveDiff = 'Elementary';
      else if (floor <= 4) effectiveDiff = 'Middle School';
      else if (floor <= 7) effectiveDiff = 'High School';
      else effectiveDiff = 'College Prep';
    }

    const { question } = getRandomQuestion(answeredQuestionIds, subject, effectiveDiff);
    setDoorQuestion(question);
    setSelectedDoorAnswer(null);
    setIsDoorAnswerCorrect(null);
    setShowDoorExplanation(false);
    setDoorEliminatedIndices([]);
    setDoorHintActive(false);
  };

  // Handle answering the Door Lock question
  const handleDoorAnswerSubmit = (optionIndex: number) => {
    if (selectedDoorAnswer !== null || !doorQuestion || !activeDoor) return;

    setSelectedDoorAnswer(optionIndex);
    const isCorrect = optionIndex === doorQuestion.correctIndex;
    setIsDoorAnswerCorrect(isCorrect);
    setShowDoorExplanation(true);
    recordAnswer(isCorrect, doorQuestion.id);

    if (isCorrect) {
      sound.play('victory');
      const bonusCoins = 15 + floor * 5;
      const bonusXp = 30 + floor * 10;
      gainCoins(bonusCoins);
      gainXp(bonusXp);

      // Trigger reward modal & unlock door:
      // The room transition happens ONLY when the user clicks 'Claim Bounty' in the modal!
      setTimeout(() => {
        setActiveDoor(null);
        setPendingRoomAdvance(() => () => {
          if (roomIndex >= totalRoomsPerFloor) {
            recordFloorCleared(floor);
            const nextFloor = floor + 1;
            setFloor(nextFloor);
            setRoomIndex(1);
          } else {
            setRoomIndex(prev => prev + 1);
          }
        });
        setActiveReward({
          title: 'Gateway Unlocked!',
          subtitle: `${activeDoor.name} Solved · Proceed to Next Chamber`,
          coins: bonusCoins,
          xp: bonusXp,
          icon: '🗝️',
        });
      }, 800);
    } else {
      sound.play('wrong');
      damagePlayer(12);
      setNotification('The door trap triggered! Lost 12 HP.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Called when player interacts with NPC
  const handleInteractNpc = () => {
    sound.play('potion');
    const restored = healPlayer(45);
    setPendingRoomAdvance(null);
    setActiveReward({
      title: 'Restorative Spring',
      subtitle: 'Hermit Sage Blessings',
      coins: 10,
      xp: 25,
      icon: '⛲',
    });
    setNpcDialog(`"Welcome, weary scholar. Drink from the celestial waters." (+${restored} HP Restored)`);
    setTimeout(() => setNpcDialog(null), 4000);
  };

  // Handle answering in the turn-based question combat
  const handleCombatAnswerSubmit = (optionIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion || !combatMonster) return;

    setSelectedAnswer(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setIsAnswerCorrect(isCorrect);
    setShowExplanation(true);
    recordAnswer(isCorrect, currentQuestion.id);

    if (isCorrect) {
      setIsAttacking(true);
      sound.play('attack');
      // Warrior's Blade active buff adds +50 DMG for 5 minutes!
      const bonusDmg = hasActiveAttackBoost ? 50 : 0;
      const playerDmg = 40 + player.level * 10 + bonusDmg;
      const monsterCurrentHp = combatMonster.hp ?? 50;
      const remainingHp = Math.max(0, monsterCurrentHp - playerDmg);

      setTimeout(() => {
        setIsAttacking(false);
        setCombatMonster(prev => (prev ? { ...prev, hp: remainingHp } : null));

        if (remainingHp <= 0) {
          // Vanquished monster
          sound.play('victory');
          const isBossDefeat = combatMonster.isBoss || combatMonster.subType === 'boss_dragon';
          const isMiniBossDefeat = combatMonster.isMiniBoss || combatMonster.subType === 'mini_boss_golem';

          recordMonsterDefeated(isBossDefeat);
          setActiveBattleMonsterId(combatMonster.id);

          const bonusCoins = isBossDefeat
            ? 120 + floor * 30
            : isMiniBossDefeat
            ? 60 + floor * 15
            : 25 + floor * 5;
          const bonusXp = isBossDefeat
            ? 250 + floor * 50
            : isMiniBossDefeat
            ? 120 + floor * 25
            : 45 + floor * 10;

          gainCoins(bonusCoins);
          gainXp(bonusXp);

          // Defeating a monster keeps player in the current room
          setPendingRoomAdvance(null);

          // Show reward pop-up modal!
          setActiveReward({
            title: isBossDefeat
              ? 'Sovereign Vanquished!'
              : isMiniBossDefeat
              ? 'Mini-Boss Destroyed!'
              : 'Monster Vanquished!',
            subtitle: `${combatMonster.name} Defeated · Chamber Wards Shattered!`,
            coins: bonusCoins,
            xp: bonusXp,
            icon: isBossDefeat ? '👑' : isMiniBossDefeat ? '⚡' : '⚔️',
          });

          setNotification(
            isBossDefeat || isMiniBossDefeat
              ? '✨ The chamber barrier has shattered! Exit gateways are now open!'
              : null
          );

          setCombatMonster(null);
        } else {
          setCombatLog(`Direct Hit! Dealt ${playerDmg} DMG to ${combatMonster.name}!`);
        }
      }, 300);
    } else {
      setIsHit(true);
      setTimeout(() => {
        setIsHit(false);
        const monsterAtk = combatMonster.atk ?? 15;
        const { died } = damagePlayer(monsterAtk);

        if (died) {
          setCombatLog(`Fallen in battle against ${combatMonster.name}. Recharging at hub.`);
        } else {
          setCombatLog(
            hasActiveShield
              ? `Your Shield Scroll negated the incoming damage!`
              : `${combatMonster.name} struck you for ${monsterAtk} HP!`
          );
        }
      }, 350);
    }
  };

  const handleCloseReward = () => {
    setActiveReward(null);
    if (pendingRoomAdvance) {
      const advanceFn = pendingRoomAdvance;
      setPendingRoomAdvance(null);
      advanceFn();
    }
  };

  const handleCloseCombat = () => {
    // If it's a boss or mini-boss, warn them they cannot escape the chamber without fighting!
    if (combatMonster?.isBoss || combatMonster?.isMiniBoss) {
      setNotification('⚠️ The chamber is sealed! You must defeat the Boss to escape!');
      setTimeout(() => setNotification(null), 3000);
    }
    setCombatMonster(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  return (
    <div className={`space-y-6 pb-12 ${isHit ? 'animate-shake' : ''}`}>
      {/* Top Floor & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl cosmic-card border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black text-lg">
            F{floor}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-purple-300 font-medium">
              <span>Infinite Dungeon</span>
              <span aria-hidden="true">·</span>
              <span>Floor {floor}</span>
              <span aria-hidden="true">·</span>
              <span>Room {roomIndex} of {totalRoomsPerFloor}</span>
            </div>
            <h2 className="text-lg font-bold text-white capitalize font-cinzel">
              {roomIndex === totalRoomsPerFloor
                ? 'Floor Sovereign Boss Lair'
                : roomIndex === 3
                ? 'Sunken Mini-Boss Colosseum'
                : currentRoomType === 'treasure'
                ? 'Treasure & Cache Vault'
                : currentRoomType === 'rest'
                ? 'Hermit Shrine Sanctuary'
                : 'Ancient Chamber (Chasing Monsters & Branching Doors)'}
            </h2>
          </div>
        </div>

        {/* Room Progress Step Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalRoomsPerFloor }).map((_, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < roomIndex;
            const isCurrent = stepNum === roomIndex;
            const isBossStep = stepNum === totalRoomsPerFloor;
            const isMiniBossStep = stepNum === 3;

            return (
              <div
                key={stepNum}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-purple-600 text-white'
                    : isCurrent
                    ? 'bg-white text-slate-900 ring-2 ring-purple-400 font-extrabold shadow-lg shadow-purple-500/30'
                    : isBossStep
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                    : isMiniBossStep
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-500 border border-white/5'
                }`}
              >
                {isBossStep ? '👑' : isMiniBossStep ? '⚡' : stepNum}
              </div>
            );
          })}
        </div>

        <button
          onClick={onBackToDashboard}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 transition-colors"
        >
          Exit to Hub
        </button>
      </div>

      {/* Active Boosts & Consumables Quick-Tray Ribbon */}
      {(hasActiveSpeedBoost || hasActiveAttackBoost || hasActiveShield || (consumables.speedBoots > 0 && !hasActiveSpeedBoost) || (consumables.strengthSword > 0 && !hasActiveAttackBoost)) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Active Buffs:</span>
            {hasActiveSpeedBoost ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold font-mono">
                <span>👢</span>
                <span>Swift Boots ({Math.floor(speedBoostSecondsRemaining / 60)}:{(speedBoostSecondsRemaining % 60).toString().padStart(2, '0')})</span>
              </span>
            ) : null}

            {hasActiveAttackBoost ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/50 text-rose-300 font-bold font-mono">
                <span>⚔️</span>
                <span>Warrior's Blade +50 DMG ({Math.floor(attackBoostSecondsRemaining / 60)}:{(attackBoostSecondsRemaining % 60).toString().padStart(2, '0')})</span>
              </span>
            ) : null}

            {hasActiveShield ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/20 border border-sky-500/50 text-sky-300 font-bold font-mono">
                <span>🛡️</span>
                <span>Aegis Shield</span>
              </span>
            ) : null}
          </div>

          {/* Quick-use utility shortcuts if owned */}
          <div className="flex items-center gap-2">
            {consumables.speedBoots > 0 && !hasActiveSpeedBoost && (
              <button
                onClick={() => useConsumable('speedBoots')}
                className="px-2 py-1 rounded bg-amber-950 border border-amber-500/40 text-amber-300 hover:bg-amber-900 text-[11px] font-semibold transition-all active:scale-95"
              >
                + Use Boots ({consumables.speedBoots})
              </button>
            )}
            {consumables.strengthSword > 0 && !hasActiveAttackBoost && (
              <button
                onClick={() => useConsumable('strengthSword')}
                className="px-2 py-1 rounded bg-rose-950 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-[11px] font-semibold transition-all active:scale-95"
              >
                + Use Blade ({consumables.strengthSword})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notifications and NPC Speech Bubble */}
      {notification && (
        <div className="p-3 bg-purple-950/80 border border-purple-400 text-purple-200 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {npcDialog && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs font-medium rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
          <span>🧙‍♂️</span>
          <span>{npcDialog}</span>
        </div>
      )}

      {/* Subject and Difficulty Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Subject:</span>
          {(['All', 'Mathematics', 'Science', 'English'] as const).map(sub => (
            <button
              key={sub}
              onClick={() => {
                setSubjectFilter(sub);
                loadCombatQuestion();
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                subjectFilter === sub
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Difficulty:</span>
          {(['All', 'Elementary', 'Middle School', 'High School', 'College Prep'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => {
                setDifficultyFilter(diff);
                loadCombatQuestion();
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                difficultyFilter === diff
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* 2D Top-Down Pixel Art Game Engine */}
      <div className="cosmic-card rounded-3xl p-4 sm:p-6 border border-white/10 flex flex-col items-center">
        <DungeonEngine
          floor={floor}
          roomNumber={roomIndex}
          roomType={currentRoomType}
          onEngageMonster={handleEngageMonster}
          onOpenChest={handleOpenChest}
          onAttemptDoor={handleAttemptDoor}
          onInteractNpc={handleInteractNpc}
          activeBattleMonsterId={activeBattleMonsterId}
          onBossSpawned={handleBossSpawned}
          isCombatActive={Boolean(combatMonster || activeDoor || activeReward || bossIntro)}
          hasActiveSpeedBoost={hasActiveSpeedBoost}
        />
      </div>

      {/* Boss & Mini-Boss Introduction Cutscene Modal */}
      {bossIntro && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 border-2 border-rose-500/60 shadow-2xl shadow-rose-950/60 text-center space-y-6 animate-scale-up relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Threat Level Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/90 border border-rose-500 text-rose-300 text-xs font-black tracking-widest uppercase animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{bossIntro.rank}</span>
            </div>

            {/* Boss Pixel Art Presentation */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner">
                <PixelSpriteView spriteType={bossIntro.spriteType} scale={5} />
              </div>
            </div>

            {/* Boss Title & Lore */}
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel tracking-wide">
                {bossIntro.name}
              </h3>
              <p className="text-xs font-medium text-amber-300 uppercase tracking-wider">
                {bossIntro.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto italic">
                "{bossIntro.lore}"
              </p>
            </div>

            {/* Stats Gauge */}
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10">
                <span className="text-slate-400 block text-[10px]">HEALTH</span>
                <span className="text-rose-400 font-bold text-sm">{bossIntro.hp} HP</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10">
                <span className="text-slate-400 block text-[10px]">ATTACK POWER</span>
                <span className="text-amber-400 font-bold text-sm">{bossIntro.atk} DMG</span>
              </div>
            </div>

            <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-500/30 text-rose-200 text-xs font-medium">
              ⚠️ The exit doorways are locked by an arcane ward. You are required to defeat this guardian to proceed!
            </div>

            {/* Engage Button */}
            <button
              onClick={handleEngageBossFromIntro}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-rose-600/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Sword className="w-5 h-5 text-amber-300" />
              <span>ENGAGE IN MORTAL COMBAT</span>
            </button>
          </div>
        </div>
      )}

      {/* Reward Earned Pop-Up Modal */}
      <RewardModal
        reward={activeReward}
        onClose={handleCloseReward}
      />

      {/* Door Riddle & Question Lock Modal (DOORS ALL HAVE QUESTIONS!) */}
      {activeDoor && doorQuestion && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="cosmic-card w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-purple-500/40 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                    Door Cipher Lock · {activeDoor.doorSubject || 'Core Knowledge'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white font-cinzel">
                    {activeDoor.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveDoor(null)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800"
              >
                Step Away
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This ancient portal is sealed with an academic cipher. Solve the problem below to unlock passage!
            </p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
                  <span>{doorQuestion.subject}</span>
                  <span>·</span>
                  <span>{doorQuestion.topic}</span>
                  <span>·</span>
                  <span>{doorQuestion.difficulty}</span>
                </div>

                {/* Scholar's Hint Potion Lifeline Button */}
                <button
                  type="button"
                  disabled={consumables.hintPotion <= 0 || doorHintActive || selectedDoorAnswer !== null}
                  onClick={handleUseDoorHintPotion}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    doorHintActive
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 cursor-default'
                      : consumables.hintPotion > 0
                      ? 'bg-indigo-900/60 hover:bg-indigo-800 border-indigo-400/50 text-indigo-200 active:scale-95'
                      : 'bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>🧪</span>
                  <span>{doorHintActive ? 'Hint Active (50/50)' : `Use Hint Potion (${consumables.hintPotion})`}</span>
                </button>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {doorQuestion.prompt}
              </h4>

              {/* Hint clue banner if potion used */}
              {doorHintActive && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 animate-fade-in">
                  <span className="text-base shrink-0">💡</span>
                  <div>
                    <span className="font-bold block">Scholar's Clue ({doorQuestion.topic}):</span>
                    <p className="text-amber-100/90 leading-relaxed mt-0.5">
                      Two incorrect choices have been dissolved! Focus closely on the fundamental logic of {doorQuestion.topic}.
                    </p>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                {doorQuestion.options.map((opt, idx) => {
                  const isChosen = selectedDoorAnswer === idx;
                  const isTarget = idx === doorQuestion.correctIndex;
                  const isEliminated = doorEliminatedIndices.includes(idx);

                  let style = 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-200';
                  if (isEliminated) {
                    style = 'bg-slate-950/40 border-white/5 text-slate-500 line-through opacity-45 cursor-not-allowed';
                  } else if (selectedDoorAnswer !== null) {
                    if (isChosen && isDoorAnswerCorrect) {
                      style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400';
                    } else if (isChosen && !isDoorAnswerCorrect) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-400';
                    } else if (isTarget) {
                      style = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedDoorAnswer !== null || isEliminated}
                      onClick={() => handleDoorAnswerSubmit(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${style}`}
                    >
                      <span className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">
                        {opt} {isEliminated && <span className="text-[10px] text-rose-400/80 ml-2 no-underline inline-block">(Eliminated by Potion)</span>}
                      </span>
                      {selectedDoorAnswer !== null && isTarget && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {selectedDoorAnswer === idx && !isDoorAnswerCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {showDoorExplanation && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isDoorAnswerCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <p className="font-bold">
                    {isDoorAnswerCorrect ? 'Portal Cipher Unlocked!' : 'Cipher Error! Trap triggered!'}
                  </p>
                  <p className="text-slate-300 leading-relaxed">{doorQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Turn-Based Question Battle Overlay Modal with ACTIVE QUESTION TIMER */}
      {combatMonster && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cosmic-card w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
            {/* Header: Monster vs Player */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-3xl">
                  {combatMonster.subType === 'boss_dragon' ? (
                    <PixelSpriteView spriteType="boss_dragon" scale={2.5} />
                  ) : combatMonster.subType === 'mini_boss_golem' ? (
                    <PixelSpriteView spriteType="mini_boss_golem" scale={2.5} />
                  ) : combatMonster.subType === 'skeleton' ? (
                    <PixelSpriteView spriteType="skeleton" scale={2.5} />
                  ) : combatMonster.subType === 'void_imp' ? (
                    <PixelSpriteView spriteType="void_imp" scale={2.5} />
                  ) : (
                    <PixelSpriteView spriteType="slime" scale={2.5} />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-cinzel">
                    {combatMonster.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-rose-400 font-mono">
                      HP: {combatMonster.hp ?? 0} / {combatMonster.maxHp ?? 50}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">ATK: {combatMonster.atk ?? 12}</span>
                  </div>
                </div>
              </div>

              {/* Player Health in Combat */}
              <div className="text-right">
                <span className="text-xs text-slate-400">Scholar Vitality</span>
                <p className="text-sm font-bold font-mono text-emerald-400">
                  {player.hp} / {player.maxHp} HP
                </p>
                {hasActiveShield && (
                  <span className="text-[10px] text-sky-400 font-semibold block">Shield Active</span>
                )}
              </div>
            </div>

            {/* Combat Feedback Log */}
            <p className="text-xs text-purple-300 bg-purple-950/50 p-2.5 rounded-lg border border-purple-500/30">
              {combatLog}
            </p>

            {/* Active Question Countdown Timer Bar */}
            {currentQuestion && selectedAnswer === null && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-white/10">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Timer className={`w-4 h-4 ${combatTimeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                    <span>TIME REMAINING</span>
                  </div>
                  <span
                    className={
                      combatTimeLeft <= 3
                        ? 'text-rose-400 animate-pulse text-sm'
                        : combatTimeLeft <= 7
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }
                  >
                    {combatTimeLeft}s
                  </span>
                </div>

                {/* Animated countdown bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      combatTimeLeft <= 3
                        ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                        : combatTimeLeft <= 7
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(combatTimeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* If monster is still active: Question Panel */}
            {currentQuestion ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-purple-400 font-bold">{currentQuestion.subject}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{currentQuestion.topic} · {currentQuestion.difficulty}</span>
                  </div>

                  {/* Scholar's Hint Potion Lifeline Button */}
                  <button
                    type="button"
                    disabled={consumables.hintPotion <= 0 || combatHintActive || selectedAnswer !== null}
                    onClick={handleUseCombatHintPotion}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      combatHintActive
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 cursor-default'
                        : consumables.hintPotion > 0
                        ? 'bg-indigo-900/60 hover:bg-indigo-800 border-indigo-400/50 text-indigo-200 active:scale-95'
                        : 'bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>🧪</span>
                    <span>{combatHintActive ? 'Hint Active (50/50)' : `Use Hint Potion (${consumables.hintPotion})`}</span>
                  </button>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQuestion.prompt}
                </h4>

                {/* Hint clue banner if potion used */}
                {combatHintActive && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 animate-fade-in">
                    <span className="text-base shrink-0">💡</span>
                    <div>
                      <span className="font-bold block">Scholar's Clue ({currentQuestion.topic}):</span>
                      <p className="text-amber-100/90 leading-relaxed mt-0.5">
                        Two incorrect choices have been dissolved! Focus on the fundamental rules of {currentQuestion.topic}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Multiple choice options */}
                <div className="space-y-2.5">
                  {currentQuestion.options.map((option, idx) => {
                    const isChosen = selectedAnswer === idx;
                    const isCorrectTarget = idx === currentQuestion.correctIndex;
                    const isEliminated = combatEliminatedIndices.includes(idx);

                    let btnStyle = 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-200';
                    if (isEliminated) {
                      btnStyle = 'bg-slate-950/40 border-white/5 text-slate-500 line-through opacity-45 cursor-not-allowed';
                    } else if (selectedAnswer !== null) {
                      if (isChosen && isAnswerCorrect) {
                        btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400';
                      } else if (isChosen && !isAnswerCorrect) {
                        btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-400';
                      } else if (isCorrectTarget) {
                        btnStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300';
                      } else {
                        btnStyle = 'bg-slate-900/40 border-white/5 text-slate-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedAnswer !== null || isEliminated}
                        onClick={() => handleCombatAnswerSubmit(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${btnStyle}`}
                      >
                        <span className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">
                          {option} {isEliminated && <span className="text-[10px] text-rose-400/80 ml-2 no-underline inline-block">(Eliminated by Potion)</span>}
                        </span>
                        {selectedAnswer !== null && isCorrectTarget && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {selectedAnswer === idx && !isAnswerCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Answer Explanation & Timeout notification */}
                {showExplanation && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      isAnswerCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      {selectedAnswer === -1 ? (
                        <>
                          <Timer className="w-4 h-4 text-rose-400" />
                          <span>Time Expired! Struck by Retaliation!</span>
                        </>
                      ) : isAnswerCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Direct Attack! Monster Hit!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>Incorrect! Retaliation Taken!</span>
                        </>
                      )}
                    </p>
                    <p className="text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                {/* Action buttons in combat */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  {selectedAnswer !== null ? (
                    <button
                      onClick={loadCombatQuestion}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        disabled={consumables.healthPotion <= 0 || player.hp >= player.maxHp}
                        onClick={() => useConsumable('healthPotion')}
                        className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 hover:bg-rose-900/60 text-rose-300 text-xs rounded-lg disabled:opacity-40"
                      >
                        🧪 Potion ({consumables.healthPotion})
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleCloseCombat}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800"
                  >
                    {combatMonster.isBoss || combatMonster.isMiniBoss ? 'Close View' : 'Flee Battle'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
