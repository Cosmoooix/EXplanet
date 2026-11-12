import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  getRankedLeaderboard,
  LeaderboardCategory,
} from '../data/leaderboardData';
import { Trophy, Award, Layers, Sparkles, User, Globe2 } from 'lucide-react';

interface LeaderboardViewProps {
  onBackToDashboard: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBackToDashboard }) => {
  const { player, stats, unlockedCosmetics } = useGame();

  const [category, setCategory] = useState<LeaderboardCategory>('highestFloor');

  const { entries, playerRank } = getRankedLeaderboard(category, {
    username: player.username,
    avatar: player.avatarBase,
    level: player.level,
    title: player.equippedTitle,
    highestFloor: stats.highestFloor,
    totalXpEarned: stats.totalXpEarned,
    correctQuestions: stats.correctQuestions,
    cosmeticsCount: unlockedCosmetics.length,
  });

  const categoryTitles: Record<LeaderboardCategory, { title: string; unit: string; icon: string }> = {
    highestFloor: { title: 'Highest Floor Reached', unit: 'Floor', icon: '🗝️' },
    level: { title: 'Highest Player Level', unit: 'Level', icon: '⭐' },
    xpEarned: { title: 'Most XP Earned', unit: 'XP', icon: '⚡' },
    questionsCorrect: { title: 'Questions Answered Correctly', unit: 'Correct', icon: '📖' },
    cosmeticsCollected: { title: 'Most Cosmetics Collected', unit: 'Items', icon: '👑' },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="cosmic-card rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Academy Rankings</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px]">
              [LOCAL / DEMO]
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
            Galactic Leaderboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Compete across five academic metrics. Rankings update dynamically as you answer questions,
            climb dungeon floors, and expand your wardrobe.
          </p>
        </div>

        {/* Player's Current Standing Box */}
        <div className="cosmic-card p-4 rounded-xl border border-purple-500/30 text-center min-w-[180px] space-y-1">
          <p className="text-xs text-purple-300 font-semibold uppercase">Your Current Rank</p>
          <p className="text-3xl font-extrabold text-white font-mono tabular-nums">
            #{playerRank}
          </p>
          <p className="text-[11px] text-slate-400">
            {player.username} · {categoryTitles[category].unit}:{' '}
            {entries.find(e => e.isCurrentPlayer)?.value.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Backend Notice Notice per Prompt */}
      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong>Simulated Galactic Peers:</strong> Displaying calibrated peer data with your dynamic local standing.
            Connect Firebase Firestore for real multi-device online multiplayer records.
          </span>
        </div>
        <button
          onClick={onBackToDashboard}
          className="text-xs text-slate-300 hover:text-white px-3 py-1 bg-slate-800 rounded-lg shrink-0"
        >
          Hub
        </button>
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(Object.keys(categoryTitles) as LeaderboardCategory[]).map(catKey => (
          <button
            key={catKey}
            onClick={() => setCategory(catKey)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              category === catKey
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <span>{categoryTitles[catKey].icon}</span>
            <span>{categoryTitles[catKey].title}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Scholar</th>
                <th className="py-3.5 px-4">Equipped Title</th>
                <th className="py-3.5 px-4 text-center">Level</th>
                <th className="py-3.5 px-4 text-right">
                  {categoryTitles[category].title}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map(entry => {
                const isMe = entry.isCurrentPlayer;
                const isTop3 = entry.rank <= 3;

                return (
                  <tr
                    key={entry.username}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-purple-950/40 text-purple-200 font-bold border-l-2 border-purple-500'
                        : 'hover:bg-slate-900/40 text-slate-200'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center font-mono">
                      {entry.rank === 1 ? (
                        <span className="text-xl" title="1st Place Champion">🥇</span>
                      ) : entry.rank === 2 ? (
                        <span className="text-xl" title="2nd Place">🥈</span>
                      ) : entry.rank === 3 ? (
                        <span className="text-xl" title="3rd Place">🥉</span>
                      ) : (
                        <span className="text-slate-400 tabular-nums">#{entry.rank}</span>
                      )}
                    </td>

                    {/* Scholar Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{entry.avatar}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">
                              {entry.username}
                            </span>
                            {isMe && (
                              <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 text-slate-400">
                      <span className="text-xs text-purple-300 font-medium">
                        {entry.title}
                      </span>
                    </td>

                    {/* Level */}
                    <td className="py-3 px-4 text-center font-mono text-slate-300 tabular-nums">
                      Lvl.{entry.level}
                    </td>

                    {/* Metric Value */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums text-sm">
                      {entry.value.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        {categoryTitles[category].unit}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
