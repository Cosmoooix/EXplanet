import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS_DATABASE } from '../data/achievements';
import { TITLES_DATABASE } from '../data/titles';
import { PlayerStats, TitleDefinition, Achievement } from '../types/game';
import { RARITY_COLORS } from '../data/cosmetics';
import {
  Award,
  Trophy,
  CheckCircle2,
  Lock,
  Sparkles,
  Coins,
  TrendingUp,
} from 'lucide-react';

interface AchievementsViewProps {
  onBackToDashboard: () => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ onBackToDashboard }) => {
  const {
    player,
    stats,
    unlockedCosmetics,
    unlockedTitles,
    claimedAchievements,
    claimAchievement,
    equipTitle,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'achievements' | 'titles'>('achievements');
  const [filterCategory, setFilterCategory] = useState<'all' | 'study' | 'combat' | 'dungeon' | 'collector'>('all');

  const filteredAchievements = ACHIEVEMENTS_DATABASE.filter(a => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    return true;
  });

  const getProgress = (ach: Achievement) => {
    let current = 0;
    if (ach.currentValueKey === 'cosmeticsOwned') {
      current = unlockedCosmetics.length;
    } else if (ach.currentValueKey === 'level') {
      current = player.level;
    } else {
      current = stats[ach.currentValueKey as keyof PlayerStats] as number;
    }
    const target = ach.targetValue;
    const percent = Math.min(100, Math.round((current / target) * 100));
    const completed = current >= target;
    return { current, target, percent, completed };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="cosmic-card rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold uppercase tracking-wider">
            <Award className="w-4 h-4 text-rose-400" />
            <span>Honors & Prestige</span>
            <span aria-hidden="true">·</span>
            <span>Earned through Academic Mastery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
            Achievements & Titles
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Claim coin and XP rewards for learning milestones. Equip prestigious titles to proudly display beside your name.
          </p>
        </div>

        <div className="cosmic-card p-4 rounded-xl border border-white/10 text-center min-w-[170px] space-y-1">
          <p className="text-xs text-slate-400">Equipped Title</p>
          <p className="text-base font-bold text-purple-300 font-cinzel truncate">
            {player.equippedTitle || 'Novice Explorer'}
          </p>
          <div className="text-[11px] text-emerald-400 pt-1 border-t border-white/5">
            {claimedAchievements.length} / {ACHIEVEMENTS_DATABASE.length} Achievements
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'achievements'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Milestone Achievements ({claimedAchievements.length} Claimed)
        </button>
        <button
          onClick={() => setActiveTab('titles')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'titles'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Prestige Titles ({unlockedTitles.length} Unlocked)
        </button>
      </div>

      {activeTab === 'achievements' ? (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {(['all', 'study', 'combat', 'dungeon', 'collector'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map(ach => {
              const { current, target, percent, completed } = getProgress(ach);
              const isClaimed = claimedAchievements.includes(ach.id);

              return (
                <div
                  key={ach.id}
                  className={`cosmic-card rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                    isClaimed
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : completed
                      ? 'border-purple-500 ring-1 ring-purple-400 bg-purple-950/30'
                      : 'border-white/5 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl p-3 bg-slate-900 rounded-xl border border-white/5 shrink-0">
                      {ach.icon}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          {ach.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{ach.description}</p>
                      {ach.rewardTitle && (
                        <p className="text-[11px] text-amber-300 font-semibold">
                          Unlocks Title: "{ach.rewardTitle}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress & Claim Button */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>Progress</span>
                      <span>
                        {current} / {target} ({percent}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isClaimed
                            ? 'bg-emerald-500'
                            : completed
                            ? 'bg-purple-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1 text-amber-300 font-mono">
                          <Coins className="w-3.5 h-3.5 text-amber-400" /> +{ach.rewardCoins}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-300 font-mono">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> +{ach.rewardXp} XP
                        </span>
                      </div>

                      {isClaimed ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Claimed
                        </span>
                      ) : completed ? (
                        <button
                          onClick={() => claimAchievement(ach.id)}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-105"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Titles Tab */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TITLES_DATABASE.map(title => {
            const isUnlocked = unlockedTitles.includes(title.name);
            const isEquipped = player.equippedTitle === title.name;
            const rarityStyle = RARITY_COLORS[title.rarity];

            return (
              <div
                key={title.id}
                className={`cosmic-card rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                  isEquipped
                    ? 'border-purple-500 ring-1 ring-purple-400 bg-purple-950/30 shadow-lg'
                    : isUnlocked
                    ? `${rarityStyle?.border || 'border-white/10'}`
                    : 'border-white/5 opacity-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-3xl">{title.icon}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rarityStyle?.text}`}>
                      {title.rarity}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white font-cinzel leading-snug">
                      {title.name}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {title.description}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      Condition: {title.unlockCondition}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {isUnlocked ? (
                    <button
                      onClick={() => equipTitle(title.name)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isEquipped
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isEquipped ? 'Equipped Title ✓' : 'Equip Title'}
                    </button>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-slate-900/60 text-slate-500 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
