import React from 'react';
import { CosmeticItem } from '../types/game';
import { RARITY_COLORS } from '../data/cosmetics';
import { Coins, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

export interface RewardData {
  title: string;
  subtitle?: string;
  coins?: number;
  xp?: number;
  cosmetic?: CosmeticItem;
  isDuplicate?: boolean;
  refundCoins?: number;
  icon?: string;
  consumableName?: string;
  consumableCount?: number;
  description?: string;
}

interface RewardModalProps {
  reward: RewardData | null;
  onClose: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ reward, onClose }) => {
  if (!reward) return null;

  const handleClaim = () => {
    sound.play('coin');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="cosmic-card w-full max-w-sm rounded-3xl p-6 border border-white/20 text-center space-y-5 shadow-2xl relative">
        {/* Glow Shimmer behind icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-amber-500/30 border border-white/20 flex items-center justify-center text-4xl shadow-xl">
          {reward.cosmetic ? reward.cosmetic.icon : reward.icon || '🎁'}
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-400">
            {reward.subtitle || 'Expedition Bounty'}
          </span>
          <h3 className="text-xl font-bold text-white font-cinzel">{reward.title}</h3>
        </div>

        {/* Cosmetic Item Detail if awarded */}
        {reward.cosmetic && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  RARITY_COLORS[reward.cosmetic.rarity]?.text
                }`}
              >
                {reward.cosmetic.rarity}
              </span>
              <span className="text-xs text-slate-400 capitalize">
                {reward.cosmetic.category}
              </span>
            </div>
            <p className="text-sm font-bold text-white font-cinzel">{reward.cosmetic.name}</p>
            <p className="text-[11px] text-slate-300 line-clamp-2">{reward.cosmetic.description}</p>
            {reward.isDuplicate && (
              <p className="text-[11px] text-amber-300 font-semibold pt-1">
                Already owned! Compensated with +{reward.refundCoins} coins.
              </p>
            )}
          </div>
        )}

        {/* Consumable Item Detail if awarded */}
        {reward.consumableName && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1 text-center">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Supply Unboxed
            </span>
            <p className="text-sm font-bold text-white font-cinzel">
              {reward.consumableName} {reward.consumableCount ? `x${reward.consumableCount}` : ''}
            </p>
            {reward.description && (
              <p className="text-[11px] text-slate-300 leading-relaxed">{reward.description}</p>
            )}
          </div>
        )}

        {/* Coins and XP Badges */}
        <div className="flex items-center justify-center gap-3">
          {reward.coins !== undefined && reward.coins > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>+{reward.coins} Coins</span>
            </div>
          )}

          {reward.xp !== undefined && reward.xp > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>+{reward.xp} XP</span>
            </div>
          )}
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
        >
          Claim Bounty
        </button>
      </div>
    </div>
  );
};
