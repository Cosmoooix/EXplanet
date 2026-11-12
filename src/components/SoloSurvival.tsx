import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { getRandomQuestion } from '../data/questions';
import { Question, Subject, Difficulty } from '../types/game';
import { sound } from '../utils/audio';
import { CharacterAvatar } from './CharacterAvatar';
import {
  ShieldAlert,
  Heart,
  Zap,
  Trophy,
  RefreshCw,
  Flame,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Shield,
} from 'lucide-react';

import { PixelSpriteView } from '../game/PixelSpriteView';

interface SoloSurvivalProps {
  onBackToDashboard: () => void;
}

const ARENA_MONSTERS = [
  { name: 'Astral Slime', spriteType: 'slime' as const, baseHp: 1, atk: 12 },
  { name: 'Skeleton Warrior', spriteType: 'skeleton' as const, baseHp: 1, atk: 15 },
  { name: 'Void Imp Scout', spriteType: 'void_imp' as const, baseHp: 2, atk: 18 },
  { name: 'Shadow Stalker', spriteType: 'void_imp' as const, baseHp: 2, atk: 20 },
  { name: 'Skeletal Champion', spriteType: 'skeleton' as const, baseHp: 3, atk: 25 },
  { name: 'Abyssal Dragon Sovereign', spriteType: 'boss_dragon' as const, baseHp: 4, atk: 30 },
];

export const SoloSurvival: React.FC<SoloSurvivalProps> = ({ onBackToDashboard }) => {
  const {
    player,
    damagePlayer,
    healPlayer,
    gainCoins,
    gainXp,
    recordAnswer,
    recordMonsterDefeated,
    recordSurvivalWave,
    stats,
    answeredQuestionIds,
    consumables,
    useConsumable,
    hasActiveShield,
  } = useGame();

  const [wave, setWave] = useState<number>(1);
  const [waveStreak, setWaveStreak] = useState<number>(0);
  const [currentMonster, setCurrentMonster] = useState<{
    name: string;
    spriteType: 'slime' | 'skeleton' | 'void_imp' | 'boss_dragon';
    hp: number;
    maxHp: number;
    atk: number;
  }>({
    name: 'Astral Slime',
    spriteType: 'slime',
    hp: 1,
    maxHp: 1,
    atk: 12,
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'All'>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');

  // Spawn monster for current wave
  const spawnMonster = (waveNum: number) => {
    const tplIdx = Math.min(ARENA_MONSTERS.length - 1, Math.floor((waveNum - 1) / 2));
    const tpl = ARENA_MONSTERS[tplIdx];
    // Stronger monsters can take multiple correct answers
    const hp = tpl.baseHp + (waveNum >= 5 ? 1 : 0) + (waveNum >= 10 ? 1 : 0);
    const atk = tpl.atk + waveNum * 2;

    setCurrentMonster({
      name: `${tpl.name} W-${waveNum}`,
      spriteType: tpl.spriteType,
      hp: hp,
      maxHp: hp,
      atk: atk,
    });

    loadQuestion();
  };

  const loadQuestion = () => {
    // Determine difficulty scale
    let effectiveDiff = difficultyFilter;
    if (effectiveDiff === 'All') {
      if (wave <= 3) effectiveDiff = 'Elementary';
      else if (wave <= 6) effectiveDiff = 'Middle School';
      else if (wave <= 10) effectiveDiff = 'High School';
      else effectiveDiff = 'College Prep';
    }

    const { question } = getRandomQuestion(answeredQuestionIds, subjectFilter, effectiveDiff);
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsAnswerCorrect(null);
  };

  useEffect(() => {
    spawnMonster(wave);
  }, []);

  const handleAnswerSubmit = (optionIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion || isGameOver) return;

    setSelectedAnswer(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setIsAnswerCorrect(isCorrect);
    setShowExplanation(true);
    recordAnswer(isCorrect, currentQuestion.id);

    if (isCorrect) {
      sound.play('attack');
      const nextHp = currentMonster.hp - 1;
      setCurrentMonster(prev => ({ ...prev, hp: nextHp }));

      if (nextHp <= 0) {
        // Monster defeated
        sound.play('victory');
        recordMonsterDefeated(wave % 5 === 0);
        const rewardCoins = 15 + wave * 5;
        const rewardXp = 35 + wave * 10;
        gainCoins(rewardCoins);
        gainXp(rewardXp);
        setWaveStreak(prev => prev + 1);
        recordSurvivalWave(wave);
      }
    } else {
      sound.play('hit');
      const { died } = damagePlayer(currentMonster.atk);
      if (died) {
        setIsGameOver(true);
      }
    }
  };

  const handleNextWave = () => {
    sound.play('click');
    const nextWave = wave + 1;
    setWave(nextWave);
    spawnMonster(nextWave);
  };

  const handleNextQuestionSameMonster = () => {
    sound.play('click');
    loadQuestion();
  };

  const handleRestart = () => {
    sound.play('click');
    healPlayer(player.maxHp);
    setIsGameOver(false);
    setWave(1);
    setWaveStreak(0);
    spawnMonster(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Colosseum Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-950">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/arena_astral_battle_1794461048874.jpg"
            alt="Colosseum Arena"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070814] via-[#070814]/85 to-transparent" />
        </div>

        <div className="relative z-10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Solo Survival Colosseum</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">Continuous Gauntlet</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
              Wave {wave} Encounter
            </h2>
            <p className="text-xs text-slate-300">
              Survive as many consecutive monster waves as possible. One wrong calculation can prove fatal.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Survival Record</p>
              <p className="text-xl font-extrabold text-amber-400 font-mono tabular-nums">
                Wave {Math.max(stats.highestSurvivalWave, wave)}
              </p>
            </div>
            <button
              onClick={onBackToDashboard}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              Exit Arena
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Subject Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Subject:</span>
          {(['All', 'Mathematics', 'Science', 'English'] as const).map(sub => (
            <button
              key={sub}
              onClick={() => {
                setSubjectFilter(sub);
                loadQuestion();
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                subjectFilter === sub
                  ? 'bg-amber-600 text-white font-medium shadow-sm'
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
                loadQuestion();
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                difficultyFilter === diff
                  ? 'bg-amber-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Arena Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monster Card */}
        <div className="lg:col-span-5 cosmic-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-semibold tracking-wider">
                  WAVE {wave} CHALLENGER
                </span>
                <h3 className="text-xl font-bold text-white">{currentMonster.name}</h3>
              </div>
              <span className="text-xs bg-rose-950/60 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded">
                DMG: {currentMonster.atk}
              </span>
            </div>

            {/* Hits required / Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Hits Remaining to Defeat</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {currentMonster.hp} / {currentMonster.maxHp}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex gap-1 p-0.5">
                {Array.from({ length: currentMonster.maxHp }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-full flex-1 rounded-sm transition-all duration-300 ${
                      idx < currentMonster.hp
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : 'bg-slate-700/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Monster Pixel Art Avatar Display */}
            <div className="h-48 rounded-xl bg-gradient-to-b from-amber-950/20 to-slate-900/60 border border-white/5 flex items-center justify-center">
              {currentMonster.hp > 0 ? (
                <div className="animate-pulse">
                  <PixelSpriteView spriteType={currentMonster.spriteType} scale={5} />
                </div>
              ) : (
                <div className="text-5xl animate-bounce">💥</div>
              )}
            </div>
          </div>

          {/* Player Vitality in Arena */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CharacterAvatar
                  avatarBase={player.avatarBase}
                  equipped={player.equippedCosmetics}
                  size="sm"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{player.username}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
                    <span className="font-mono tabular-nums text-slate-200">
                      {player.hp} / {player.maxHp} HP
                    </span>
                  </div>
                </div>
              </div>

              {/* In-Arena Potions */}
              <div className="flex items-center gap-2">
                <button
                  disabled={consumables.healthPotion <= 0 || player.hp >= player.maxHp}
                  onClick={() => useConsumable('healthPotion')}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium disabled:opacity-40 transition-colors"
                  title="Drink Health Potion (+45 HP)"
                >
                  🧪 Potion ({consumables.healthPotion})
                </button>
                <button
                  disabled={consumables.shieldScroll <= 0 || hasActiveShield}
                  onClick={() => useConsumable('shieldScroll')}
                  className="px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-500/40 hover:bg-sky-900/60 text-sky-300 text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
                  title="Cast Shield Scroll"
                >
                  <Shield className="w-3 h-3" /> ({consumables.shieldScroll})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between cosmic-card rounded-2xl p-6 border border-white/10 space-y-6">
          {isGameOver ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 text-3xl font-black">
                💀
              </div>
              <h3 className="text-2xl font-bold text-white font-cinzel">Fallen in the Arena</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                You fought valiantly and survived to Wave {wave}. Refresh your vitality and step back into the circle.
              </p>
              <div className="pt-2 flex justify-center gap-4">
                <button
                  onClick={handleRestart}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
                >
                  Play Again
                </button>
                <button
                  onClick={onBackToDashboard}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
                >
                  Hub Return
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">{currentQuestion.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{currentQuestion.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-300">{currentQuestion.difficulty}</span>
                  </div>
                  <span className="text-amber-300">Wave Streak: {waveStreak}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                  {currentQuestion.prompt}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isChosen = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let style = 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-200';
                  if (selectedAnswer !== null) {
                    if (isChosen && isAnswerCorrect) {
                      style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400';
                    } else if (isChosen && !isAnswerCorrect) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-400';
                    } else if (isCorrect) {
                      style = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300';
                    } else {
                      style = 'bg-slate-900/40 border-white/5 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedAnswer !== null || currentMonster.hp <= 0}
                      onClick={() => handleAnswerSubmit(idx)}
                      className={`w-full text-left p-4 rounded-xl border text-sm sm:text-base font-medium transition-all flex items-start gap-3 ${style}`}
                    >
                      <span className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400 shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {selectedAnswer !== null && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {selectedAnswer === idx && !isAnswerCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm space-y-1.5 transition-all ${
                    isAnswerCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {isAnswerCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Strike Landed!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Defensive Breach!</span>
                      </>
                    )}
                  </p>
                  <p className="text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Action Footer */}
          {!isGameOver && (
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              {currentMonster.hp <= 0 ? (
                <button
                  onClick={handleNextWave}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <span>Advance to Wave {wave + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : selectedAnswer !== null ? (
                <button
                  onClick={handleNextQuestionSameMonster}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-xs text-slate-400">Answer to strike the monster.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
