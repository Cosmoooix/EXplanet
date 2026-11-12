import React from 'react';
import { useGame } from '../context/GameContext';
import { CharacterAvatar } from './CharacterAvatar';
import {
  Sword,
  Brain,
  ShieldAlert,
  Sparkles,
  ShoppingBag,
  Trophy,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  Heart,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenSettings }) => {
  const { player, stats, unlockedCosmetics } = useGame();

  const xpPercent = Math.min(100, Math.round((player.xp / player.xpForNextLevel) * 100));
  const hpPercent = Math.min(100, Math.round((player.hp / player.maxHp) * 100));
  const accuracy =
    stats.totalQuestionsAnswered > 0
      ? Math.round((stats.correctQuestions / stats.totalQuestionsAnswered) * 100)
      : 100;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
        {/* Background Image with Measured Contrast Scrim */}
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/explanet_hero_nebula_1794461048256.jpg"
            alt="EXPlanet Academy Nebula"
            className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070814] via-[#070814]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070814] via-transparent to-transparent" />
        </div>

        {/* Content Inside Hero */}
        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-4">
              <img
                src="/assets/aistudio/image_8b4ae633.png"
                alt="Official EXPlanet Logo"
                className="h-16 w-auto object-contain rounded-xl bg-white/95 p-2 shadow-xl border border-white/20"
              />
              <div>
                <div className="flex items-center gap-2 text-xs text-purple-300 font-medium tracking-wide">
                  <span>Orbital Academy</span>
                  <span aria-hidden="true">·</span>
                  <span>2D Pixel-Art RPG</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400">Pure Programmed Game</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-cinzel leading-tight">
                  Welcome to EXPlanet
                </h1>
              </div>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore the infinite dungeons of the cosmos. Conquer mathematical, scientific, and linguistic
              trials to defeat abyssal monsters, harvest celestial coins, and collect over 100 rare cosmetics.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('dungeon')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sword className="w-4 h-4" />
                <span>Enter Infinite Dungeon</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => onNavigate('recall')}
                className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Active Recall Study</span>
              </button>
            </div>
          </div>

          {/* Student Profile Identity Card */}
          <div className="w-full md:w-80 cosmic-card p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-4">
              <CharacterAvatar
                avatarBase={player.avatarBase}
                equipped={player.equippedCosmetics}
                size="md"
              />
              <div className="overflow-hidden">
                <p className="text-xs text-purple-300 font-semibold tracking-wider uppercase">
                  {player.equippedTitle || 'Explorer'}
                </p>
                <h3 className="text-lg font-bold text-white truncate">{player.username}</h3>
                <p className="text-xs text-slate-400">Level {player.level} Scholar</p>
              </div>
            </div>

            {/* Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
                  Health
                </span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {player.hp} / {player.maxHp} HP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  Experience
                </span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {player.xp} / {player.xpForNextLevel} XP ({xpPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Owned Cosmetics: <strong className="text-white">{unlockedCosmetics.length}</strong> / 100</span>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Wardrobe →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Main Game Modes Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Core Learning Portals
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Select an operational mode to engage in knowledge combat or focused self-testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mode 1: Infinite Dungeon */}
          <div
            onClick={() => onNavigate('dungeon')}
            className="group cursor-pointer cosmic-card cosmic-card-hover rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src="/src/assets/images/dungeon_cosmic_portal_1794461048820.jpg"
                alt="Infinite Dungeon Portal"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1124] via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs px-2.5 py-1 rounded-md font-medium">
                Main Adventure
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                  <span>Infinite Dungeon</span>
                  <Sword className="w-4 h-4 text-purple-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Explore a retro 2D top-down pixel-art dungeon with real WASD/arrow movement and collision.
                  Open chests with [E], avoid pits, and engage monsters in question battles!
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">High Floor: <strong className="text-white">{stats.highestFloor}</strong></span>
                <span className="text-purple-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Descend <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Mode 2: Active Recall Study */}
          <div
            onClick={() => onNavigate('recall')}
            className="group cursor-pointer cosmic-card cosmic-card-hover rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between"
          >
            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 transition-transform">
                🧠
              </div>
              <div className="absolute top-3 left-3 bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs px-2.5 py-1 rounded-md font-medium">
                Self Study Suite
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>Active Recall</span>
                  <Brain className="w-4 h-4 text-indigo-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Upload your own lecture notes or paste text. Highlight phrases to create fill-in-the-blank cloze cards
                  and review with flipped recall.
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Custom Decks Ready</span>
                <span className="text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Open Desk <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Mode 3: Solo Survival */}
          <div
            onClick={() => onNavigate('survival')}
            className="group cursor-pointer cosmic-card cosmic-card-hover rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src="/src/assets/images/arena_astral_battle_1794461048874.jpg"
                alt="Astral Battle Arena"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1124] via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1 rounded-md font-medium">
                Endurance Gauntlet
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                  <span>Solo Survival</span>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Step into the cosmic colosseum. Defeat wave after wave of increasingly resilient monsters.
                  How long can your knowledge keep you alive?
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Record Wave: <strong className="text-white">{stats.highestSurvivalWave}</strong></span>
                <span className="text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Enter Arena <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Fast Access Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <button
          onClick={() => onNavigate('chests')}
          className="p-4 rounded-xl cosmic-card cosmic-card-hover text-left flex flex-col justify-between space-y-2 border border-white/5"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Chests</p>
            <p className="text-xs text-slate-400">100 Cosmetics</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('shop')}
          className="p-4 rounded-xl cosmic-card cosmic-card-hover text-left flex flex-col justify-between space-y-2 border border-white/5"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Shop</p>
            <p className="text-xs text-slate-400">Potions & Gear</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-xl cosmic-card cosmic-card-hover text-left flex flex-col justify-between space-y-2 border border-white/5"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Inventory</p>
            <p className="text-xs text-slate-400">Equip Wardrobe</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('leaderboard')}
          className="p-4 rounded-xl cosmic-card cosmic-card-hover text-left flex flex-col justify-between space-y-2 border border-white/5"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Leaderboard</p>
            <p className="text-xs text-slate-400">Galactic Rankings</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('achievements')}
          className="p-4 rounded-xl cosmic-card cosmic-card-hover text-left flex flex-col justify-between space-y-2 border border-white/5"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Achievements</p>
            <p className="text-xs text-slate-400">Claim Rewards</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('trading')}
          className="p-4 rounded-xl cosmic-card cosmic-card-hover text-left flex flex-col justify-between space-y-2 border border-white/5"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Trading Floor</p>
            <p className="text-xs text-slate-400">Peer Exchange</p>
          </div>
        </button>
      </div>

      {/* Academic Performance & Lifetime Statistics */}
      <div className="cosmic-card rounded-2xl p-6 border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white font-cinzel">Lifetime Academic Telemetry</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {stats.totalQuestionsAnswered}
            </p>
            <p className="text-xs text-slate-400 mt-1">Questions Solved</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <p className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {accuracy}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Accuracy</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <p className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
              {stats.highestStreak}
            </p>
            <p className="text-xs text-slate-400 mt-1">Highest Streak</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <p className="text-2xl font-extrabold text-purple-400 font-mono tabular-nums">
              {stats.monstersDefeated}
            </p>
            <p className="text-xs text-slate-400 mt-1">Monsters Banished</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <p className="text-2xl font-extrabold text-indigo-400 font-mono tabular-nums">
              {stats.bossesDefeated}
            </p>
            <p className="text-xs text-slate-400 mt-1">Bosses Defeated</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
            <p className="text-2xl font-extrabold text-cyan-400 font-mono tabular-nums">
              {stats.chestsOpened}
            </p>
            <p className="text-xs text-slate-400 mt-1">Chests Opened</p>
          </div>
        </div>
      </div>
    </div>
  );
};
