import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS_DATABASE, RARITY_COLORS } from '../data/cosmetics';
import { CosmeticCategory, CosmeticItem } from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';
import { sound } from '../utils/audio';
import {
  Layers,
  Shield,
  Heart,
  TrendingUp,
  Key,
  X,
  Check,
  Sparkles,
} from 'lucide-react';

interface InventoryViewProps {
  onNavigateToShop: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onNavigateToShop }) => {
  const {
    player,
    unlockedCosmetics,
    equipCosmetic,
    consumables,
    useConsumable,
    healPlayer,
    hasActiveShield,
    hasActiveXpElixir,
    hasActiveSpeedBoost,
    speedBoostSecondsRemaining,
    hasActiveAttackBoost,
    attackBoostSecondsRemaining,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'cosmetics' | 'consumables'>('cosmetics');
  const [selectedCategory, setSelectedCategory] = useState<CosmeticCategory | 'All'>('All');

  const categories: { key: CosmeticCategory; label: string }[] = [
    { key: 'hat', label: 'Hats' },
    { key: 'hair', label: 'Hair' },
    { key: 'mask', label: 'Masks' },
    { key: 'outfit', label: 'Outfits' },
    { key: 'weapon', label: 'Weapons' },
    { key: 'pet', label: 'Pets' },
    { key: 'trail', label: 'Trails' },
    { key: 'aura', label: 'Auras' },
  ];

  const ownedItems = COSMETICS_DATABASE.filter(item => unlockedCosmetics.includes(item.id));

  const filteredItems = ownedItems.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    return true;
  });

  const handleEquip = (item: CosmeticItem) => {
    const isCurrentlyEquipped = player.equippedCosmetics[item.category] === item.id;
    equipCosmetic(item.category, isCurrentlyEquipped ? null : item.id);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Character Doll Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Character Preview & Equipped Slots */}
        <div className="lg:col-span-5 cosmic-card rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col items-center text-center space-y-6">
          <div className="space-y-1">
            <span className="text-xs text-purple-400 font-semibold tracking-wider uppercase">
              {player.equippedTitle || 'Novice Explorer'}
            </span>
            <h2 className="text-2xl font-extrabold text-white font-cinzel">{player.username}</h2>
            <p className="text-xs text-slate-400">Level {player.level} Scholar</p>
          </div>

          {/* Large Avatar preview */}
          <div className="py-4">
            <CharacterAvatar
              avatarBase={player.avatarBase}
              equipped={player.equippedCosmetics}
              size="xl"
            />
          </div>

          {/* Currently Equipped Summary Badges */}
          <div className="w-full space-y-2 pt-2 border-t border-white/10 text-left">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Equipped Loadout
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {categories.map(cat => {
                const eqId = player.equippedCosmetics[cat.key];
                const eqItem = COSMETICS_DATABASE.find(c => c.id === eqId);
                return (
                  <div
                    key={cat.key}
                    className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between"
                  >
                    <div className="truncate pr-1">
                      <span className="text-[10px] text-slate-500 block">{cat.label}</span>
                      <span className="text-xs font-medium text-slate-200 truncate block">
                        {eqItem ? eqItem.name : 'Empty'}
                      </span>
                    </div>
                    {eqItem && (
                      <button
                        onClick={() => equipCosmetic(cat.key, null)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Unequip"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Inventory Items & Tabs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('cosmetics')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cosmetics'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cosmetic Wardrobe ({ownedItems.length} Owned)
            </button>
            <button
              onClick={() => setActiveTab('consumables')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'consumables'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Field Consumables
            </button>
          </div>

          {activeTab === 'cosmetics' ? (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({ownedItems.length})
                </button>
                {categories.map(cat => {
                  const count = ownedItems.filter(i => i.category === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === cat.key
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredItems.map(item => {
                  const isEquipped = player.equippedCosmetics[item.category] === item.id;
                  const rarityStyle = RARITY_COLORS[item.rarity];

                  return (
                    <div
                      key={item.id}
                      className={`cosmic-card rounded-2xl p-4 border flex flex-col justify-between space-y-3 transition-all ${
                        isEquipped
                          ? 'border-purple-500 ring-1 ring-purple-400 shadow-lg shadow-purple-950/50'
                          : `${rarityStyle?.border || 'border-white/10'}`
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-3xl filter drop-shadow">{item.icon}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rarityStyle?.text}`}>
                            {item.rarity}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          <span className="text-[10px] text-slate-500 capitalize">{item.category}</span>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEquip(item)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          isEquipped
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isEquipped ? 'Equipped ✓' : 'Equip'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <p>No owned items in this category yet.</p>
                  <button
                    onClick={onNavigateToShop}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Visit Galactic Shop →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Consumables Tab */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Swift Boots */}
              <div className="cosmic-card rounded-2xl p-5 border border-amber-500/30 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-4xl">👢</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-amber-300">
                    x{consumables.speedBoots} In Stock
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Swift Astral Boots</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Surges movement speed for 5 minutes, allowing you to easily outpace all chasing dungeon monsters.
                  </p>
                  {hasActiveSpeedBoost && (
                    <span className="text-[11px] text-amber-400 font-mono font-bold block mt-1.5 animate-pulse">
                      ⚡ Active! Remaining: {Math.floor(speedBoostSecondsRemaining / 60)}:{(speedBoostSecondsRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <button
                  disabled={consumables.speedBoots <= 0 || hasActiveSpeedBoost}
                  onClick={() => useConsumable('speedBoots')}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                >
                  {hasActiveSpeedBoost ? 'Boots Currently Active' : 'Equip Boots (5 Min Boost)'}
                </button>
              </div>

              {/* Warrior's Blade */}
              <div className="cosmic-card rounded-2xl p-5 border border-rose-500/30 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-4xl">⚔️</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-rose-300">
                    x{consumables.strengthSword} In Stock
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Warrior's Obsidian Blade</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Imbues scholar attacks with +50 DMG for 5 minutes in combat against monsters and bosses.
                  </p>
                  {hasActiveAttackBoost && (
                    <span className="text-[11px] text-rose-400 font-mono font-bold block mt-1.5 animate-pulse">
                      🔥 Active! Remaining: {Math.floor(attackBoostSecondsRemaining / 60)}:{(attackBoostSecondsRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <button
                  disabled={consumables.strengthSword <= 0 || hasActiveAttackBoost}
                  onClick={() => useConsumable('strengthSword')}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                >
                  {hasActiveAttackBoost ? 'Blade Currently Active' : 'Wield Blade (+50 DMG, 5 Mins)'}
                </button>
              </div>

              {/* Scholar's Hint Potion */}
              <div className="cosmic-card rounded-2xl p-5 border border-purple-500/30 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-4xl">🧪</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-purple-300">
                    x{consumables.hintPotion} In Stock
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Scholar's Mind-Sight Potion</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Question lifeline: dissolves 2 false options (50/50) and reveals key subject topic clues in battles and door ciphers.
                  </p>
                  <span className="text-[10px] text-purple-300 font-medium block mt-1">
                    Used during combat questions and door lock ciphers
                  </span>
                </div>
                <button
                  disabled
                  className="w-full py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-semibold cursor-default"
                >
                  Use In Dungeon Questions
                </button>
              </div>

              {/* Health Potion */}
              <div className="cosmic-card rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-4xl">❤️</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-rose-300">
                    x{consumables.healthPotion} In Stock
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Super Vitality Potion</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Restores +45 HP immediately. Current HP: {player.hp} / {player.maxHp}.
                  </p>
                </div>
                <button
                  disabled={consumables.healthPotion <= 0 || player.hp >= player.maxHp}
                  onClick={() => useConsumable('healthPotion')}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                >
                  Use Potion (+45 HP)
                </button>
              </div>

              {/* Shield Scroll */}
              <div className="cosmic-card rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-4xl">📜</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-sky-300">
                    x{consumables.shieldScroll} In Stock
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Aegis Shield Scroll</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Negates the next incoming monster damage attack.
                  </p>
                  {hasActiveShield && (
                    <span className="text-[10px] text-sky-400 font-semibold block mt-1">
                      Status: Active Shield In Effect!
                    </span>
                  )}
                </div>
                <button
                  disabled={consumables.shieldScroll <= 0 || hasActiveShield}
                  onClick={() => useConsumable('shieldScroll')}
                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                >
                  {hasActiveShield ? 'Already Shielded' : 'Activate Shield'}
                </button>
              </div>

              {/* XP Elixir */}
              <div className="cosmic-card rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-4xl">⚗️</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-indigo-300">
                    x{consumables.xpElixir} In Stock
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Scholarly Insight Elixir</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Grants +50% XP multiplier on all correct answers.
                  </p>
                  {hasActiveXpElixir && (
                    <span className="text-[10px] text-indigo-400 font-semibold block mt-1">
                      Status: +50% XP Boost Active!
                    </span>
                  )}
                </div>
                <button
                  disabled={consumables.xpElixir <= 0 || hasActiveXpElixir}
                  onClick={() => useConsumable('xpElixir')}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                >
                  {hasActiveXpElixir ? 'Elixir Active' : 'Drink Elixir (+50% XP)'}
                </button>
              </div>

              {/* Cosmic Key */}
              <div className="cosmic-card rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-4xl">🗝️</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-amber-300">
                    x{consumables.cosmicKey} In Stock
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Astral Skeleton Key</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Automatically bypasses locked dungeon room chest mechanisms.
                  </p>
                </div>
                <button
                  disabled
                  className="w-full py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium cursor-default"
                >
                  Used Automatically In Dungeons
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
