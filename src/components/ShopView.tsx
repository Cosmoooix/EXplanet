import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS_DATABASE, RARITY_COLORS } from '../data/cosmetics';
import { CosmeticItem, CosmeticCategory, ConsumableInventory } from '../types/game';
import { sound } from '../utils/audio';
import {
  ShoppingBag,
  Coins,
  CheckCircle2,
  Sparkles,
  Shield,
  Heart,
  TrendingUp,
  Key,
  Layers,
} from 'lucide-react';

interface ShopViewProps {
  onNavigateToInventory: () => void;
  onNavigateToChests: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  onNavigateToInventory,
  onNavigateToChests,
}) => {
  const {
    player,
    unlockedCosmetics,
    buyCosmetic,
    equipCosmetic,
    buyConsumable,
    consumables,
    openChest,
  } = useGame();

  const [activeCategory, setActiveCategory] = useState<CosmeticCategory | 'All'>('All');
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  const purchasableCosmetics = COSMETICS_DATABASE.filter(c => c.shopPrice !== undefined);

  const filteredCosmetics = purchasableCosmetics.filter(item => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    return true;
  });

  const handleBuyCosmetic = (item: CosmeticItem) => {
    const success = buyCosmetic(item);
    if (success) {
      setPurchaseSuccessMessage(`Purchased "${item.name}"!`);
      setTimeout(() => setPurchaseSuccessMessage(null), 3000);
    }
  };

  const handleEquipToggle = (item: CosmeticItem) => {
    const isEquipped = player.equippedCosmetics[item.category] === item.id;
    equipCosmetic(item.category, isEquipped ? null : item.id);
  };

  const consumableOffers: {
    key: keyof ConsumableInventory;
    name: string;
    description: string;
    icon: string;
    price: number;
    owned: number;
  }[] = [
    {
      key: 'speedBoots',
      name: 'Swift Boots (5 Mins Speed Surge)',
      description: 'Increases player speed by +45% for 5 minutes, allowing you to easily outpace chasing monsters.',
      icon: '👢',
      price: 500,
      owned: consumables.speedBoots || 0,
    },
    {
      key: 'strengthSword',
      name: "Warrior's Blade (5 Mins +50 ATK)",
      description: 'Empowers your educational strikes with +50 bonus damage on every correct answer for 5 minutes.',
      icon: '⚔️',
      price: 650,
      owned: consumables.strengthSword || 0,
    },
    {
      key: 'hintPotion',
      name: "Scholar's Hint Potion",
      description: 'Reveals crucial subject hints and eliminates 2 incorrect options in battles and door ciphers.',
      icon: '💡',
      price: 450,
      owned: consumables.hintPotion || 0,
    },
    {
      key: 'healthPotion',
      name: 'Super Vitality Potion',
      description: 'Restores +45 HP immediately in or out of battle.',
      icon: '🧪',
      price: 150,
      owned: consumables.healthPotion || 0,
    },
    {
      key: 'shieldScroll',
      name: 'Aegis Shield Scroll',
      description: 'Absorbs and negates the next incoming monster damage attack.',
      icon: '📜',
      price: 250,
      owned: consumables.shieldScroll || 0,
    },
    {
      key: 'xpElixir',
      name: 'Scholarly Insight Elixir',
      description: 'Grants +50% XP bonus on future correct answers.',
      icon: '⚗️',
      price: 350,
      owned: consumables.xpElixir || 0,
    },
    {
      key: 'cosmicKey',
      name: 'Astral Skeleton Key',
      description: 'Opens locked celestial chests discovered in deep dungeon corridors.',
      icon: '🗝️',
      price: 800,
      owned: consumables.cosmicKey || 0,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Shop Header */}
      <div className="cosmic-card rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>EXPlanet Emporium</span>
            <span aria-hidden="true">·</span>
            <span>Earned Coins Only</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
            Galactic Outpost Shop
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Acquire cosmetic upgrades, utility consumables, and supply chests using your hard-earned educational
            currency. No real money gambling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300">
            <Coins className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] text-amber-400 font-semibold uppercase">Wallet Balance</p>
              <p className="text-lg font-bold font-mono tabular-nums text-white">
                {player.coins.toLocaleString()} Coins
              </p>
            </div>
          </div>
        </div>
      </div>

      {purchaseSuccessMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{purchaseSuccessMessage}</span>
        </div>
      )}

      {/* Section 1: Utility Consumables */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white font-cinzel">Expedition Consumables</h3>
          <p className="text-xs text-slate-400">Essential field supplies to endure deeper dungeon floors.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {consumableOffers.map(item => (
            <div
              key={item.key}
              className="cosmic-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                    Owned: {item.owned}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{item.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>

              <button
                disabled={player.coins < item.price}
                onClick={() => {
                  buyConsumable(item.key, item.price);
                  setPurchaseSuccessMessage(`Purchased ${item.name}!`);
                  setTimeout(() => setPurchaseSuccessMessage(null), 2500);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Buy ({item.price} Coins)</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Non-Purchasable Cosmetic Showcase */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h4 className="text-sm font-bold text-white font-cinzel">Cosmetics are Prestigious Relics</h4>
              <p className="text-xs text-purple-200">
                Cosmetics cannot be directly bought with coins! They must be discovered in ancient chests or earned via achievements.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToChests}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 flex items-center gap-1.5"
          >
            <span>Open Vault Chests</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-cinzel">Cosmetics Archive (Non-Purchasable)</h3>
            <p className="text-xs text-slate-400">Discoverable exclusively through expedition chests and trials.</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {(['All', 'hat', 'hair', 'mask', 'outfit', 'weapon', 'pet', 'trail', 'aura'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  activeCategory === cat
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCosmetics.map(item => {
            const isOwned = unlockedCosmetics.includes(item.id);
            const isEquipped = player.equippedCosmetics[item.category] === item.id;
            const rarityStyle = RARITY_COLORS[item.rarity];

            return (
              <div
                key={item.id}
                className="cosmic-card cosmic-card-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-4xl filter drop-shadow">{item.icon}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rarityStyle?.text}`}>
                      {item.rarity}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 capitalize">{item.category}</span>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {isOwned ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEquipToggle(item)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isEquipped
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'Equipped ✓' : 'Equip'}
                      </button>
                      <button
                        onClick={onNavigateToInventory}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                        title="View in Wardrobe"
                      >
                        Wardrobe
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onNavigateToChests}
                      className="w-full py-2.5 rounded-xl bg-slate-900/80 hover:bg-purple-950/60 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Found in Chests</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
