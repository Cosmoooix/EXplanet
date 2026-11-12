import { useGame, OpenChestResult } from '../context/GameContext';
import { COSMETICS_DATABASE, RARITY_COLORS } from '../data/cosmetics';
import { CosmeticItem, CosmeticCategory, Rarity } from '../types/game';
import { sound } from '../utils/audio';
import {
  Sparkles,
  Coins,
  Lock,
  CheckCircle2,
  Filter,
  Layers,
  ChevronRight,
  Gift,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface ChestsViewProps {
  onBackToDashboard: () => void;
}

export const ChestsView: React.FC<ChestsViewProps> = ({ onBackToDashboard }) => {
  const { player, unlockedCosmetics, openChest } = useGame();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CosmeticCategory | 'All'>('All');
  const [activeRarityFilter, setActiveRarityFilter] = useState<Rarity | 'All'>('All');
  const [activeSpecialFilter, setActiveSpecialFilter] = useState<boolean>(false);

  // Chest Unboxing Ceremony State
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [unboxedResult, setUnboxedResult] = useState<OpenChestResult | null>(null);

  const [inspectItem, setInspectItem] = useState<CosmeticItem | null>(null);

  const categories: (CosmeticCategory | 'All')[] = [
    'All',
    'hat',
    'hair',
    'mask',
    'outfit',
    'weapon',
    'pet',
    'trail',
    'aura',
  ];

  const rarities: (Rarity | 'All')[] = [
    'All',
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Mythic',
  ];

  const filteredCosmetics = COSMETICS_DATABASE.filter(item => {
    if (activeCategoryFilter !== 'All' && item.category !== activeCategoryFilter) return false;
    if (activeRarityFilter !== 'All' && item.rarity !== activeRarityFilter) return false;
    if (activeSpecialFilter && !item.isSpecial) return false;
    return true;
  });

  const specialTotal = COSMETICS_DATABASE.filter(c => c.isSpecial).length; // 20
  const specialOwned = COSMETICS_DATABASE.filter(c => c.isSpecial && unlockedCosmetics.includes(c.id)).length;

  const handleOpenChestAction = (type: 'Standard' | 'Mystic' | 'Cosmic') => {
    setIsOpening(true);
    setUnboxedResult(null);

    setTimeout(() => {
      const res = openChest(type, false);
      setIsOpening(false);
      if (res) {
        setUnboxedResult(res);
      }
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Chest Summoning Chamber */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 p-6 sm:p-10">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/treasure_cosmic_chest_1794461049316.jpg"
            alt="Cosmic Chest Treasury"
            className="w-full h-full object-cover opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070814] via-[#070814]/85 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Cosmetics & Chest Treasury</span>
              <span aria-hidden="true">·</span>
              <span>100 Unique Collectibles</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-cinzel">
              Celestial Chest Vault
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Unlock chests using in-game coins earned from completing dungeons and quizzes.
              Includes <strong>exactly 20 ultra-rare Legendary & Mythic relics</strong>. Duplicate items
              automatically award coin compensation!
            </p>
          </div>

          <div className="cosmic-card p-4 rounded-2xl border border-white/10 text-center min-w-[200px] space-y-1">
            <p className="text-xs text-slate-400">Total Collection</p>
            <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {unlockedCosmetics.length} <span className="text-sm text-slate-500">/ 100</span>
            </p>
            <div className="pt-2 border-t border-white/5 text-xs text-amber-400 font-medium">
              Special Relics: {specialOwned} / {specialTotal}
            </div>
          </div>
        </div>

        {/* 3 Interactive Chests Row */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {/* Standard Chest */}
          <div className="cosmic-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-3xl">📦</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  Starter Vault
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-2 font-cinzel">Standard Chest</h3>
              <p className="text-xs text-slate-400 mt-1">
                Expedition supplies, Swift Boots, Hint Potions, and rare cosmetics. 0.05% chance for ultra-rare relics.
              </p>
            </div>

            <button
              disabled={isOpening || player.coins < 2500}
              onClick={() => handleOpenChestAction('Standard')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-amber-500/20"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Unlock (2,500 Coins)</span>
            </button>
          </div>

          {/* Mystic Chest */}
          <div className="cosmic-card rounded-2xl p-6 border border-purple-500/30 flex flex-col justify-between space-y-4 shadow-lg shadow-purple-950/40">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-3xl">🔮</span>
                <span className="text-xs bg-purple-950/80 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded">
                  Mystic Vault
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-2 font-cinzel">Mystic Chest</h3>
              <p className="text-xs text-slate-400 mt-1">
                Potent arsenal bundles, Warrior Blades, gold caches, and elevated cosmetic odds. 0.25% chance for special relics.
              </p>
            </div>

            <button
              disabled={isOpening || player.coins < 3500}
              onClick={() => handleOpenChestAction('Mystic')}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Unlock (3,500 Coins)</span>
            </button>
          </div>

          {/* Cosmic Chest */}
          <div className="cosmic-card rounded-2xl p-6 border border-amber-500/40 flex flex-col justify-between space-y-4 shadow-xl shadow-amber-950/40 bg-gradient-to-b from-[#14122b] to-[#0c0d20]">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-3xl animate-bounce">✨</span>
                <span className="text-xs bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                  Highest Tier
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-2 font-cinzel">Cosmic Chest</h3>
              <p className="text-xs text-slate-400 mt-1">
                Highest-tier vault caches. High-grade gear, hoard caches, and prestige cosmetics. 0.8% for Mythic Relics.
              </p>
            </div>

            <button
              disabled={isOpening || player.coins < 5000}
              onClick={() => handleOpenChestAction('Cosmic')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
            >
              <Coins className="w-3.5 h-3.5 text-slate-950" />
              <span>Unlock (5,000 Coins)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Opening Modal Overlay Ceremony */}
      {(isOpening || unboxedResult) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cosmic-card w-full max-w-md rounded-3xl p-8 border border-white/20 text-center space-y-6 shadow-2xl relative overflow-hidden animate-scale-up">
            {isOpening ? (
              <div className="py-12 space-y-4">
                <div className="text-7xl animate-spin">🔮</div>
                <h3 className="text-2xl font-bold text-white font-cinzel animate-pulse">
                  Unlocking Celestial Chest...
                </h3>
                <p className="text-xs text-slate-400">Harmonizing cosmic wavelengths</p>
              </div>
            ) : unboxedResult ? (
              <div className="space-y-5">
                {unboxedResult.rewardType === 'cosmetic' && unboxedResult.item ? (
                  <>
                    <span className="text-xs font-semibold tracking-wider uppercase text-purple-400">
                      {unboxedResult.isDuplicate ? 'Duplicate Cosmetic' : 'Rare Relic Discovered!'}
                    </span>

                    <div
                      className="w-28 h-28 mx-auto rounded-2xl flex items-center justify-center text-6xl shadow-2xl relative"
                      style={{
                        backgroundColor: unboxedResult.item.glowColor
                          ? `${unboxedResult.item.glowColor}25`
                          : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${unboxedResult.item.glowColor || 'rgba(255,255,255,0.2)'}`,
                        boxShadow: `0 0 30px ${unboxedResult.item.glowColor || 'rgba(147, 51, 234, 0.4)'}`,
                      }}
                    >
                      {unboxedResult.item.icon}
                      {unboxedResult.item.isSpecial && (
                        <span className="absolute -top-2 -right-2 text-xs bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full shadow">
                          SPECIAL
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            RARITY_COLORS[unboxedResult.item.rarity]?.text
                          }`}
                        >
                          {unboxedResult.item.rarity}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                          {unboxedResult.item.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white font-cinzel">
                        {unboxedResult.item.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                        {unboxedResult.item.description}
                      </p>
                    </div>

                    {unboxedResult.isDuplicate ? (
                      <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-medium">
                        Duplicate item compensated with <strong>+{unboxedResult.refundCoins} coins</strong>.
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium">
                        Added to your wardrobe! Equip it anytime in Wardrobe/Inventory.
                      </div>
                    )}
                  </>
                ) : unboxedResult.rewardType === 'consumable' ? (
                  <>
                    <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                      Expedition Supplies Unboxed!
                    </span>

                    <div className="w-28 h-28 mx-auto rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-6xl shadow-2xl shadow-amber-500/20">
                      {unboxedResult.consumableIcon || '📦'}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono text-amber-400 uppercase">
                        Utility Gear ({unboxedResult.consumableCount}x)
                      </span>
                      <h3 className="text-xl font-bold text-white font-cinzel">
                        {unboxedResult.consumableName}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                        {unboxedResult.message}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-300">
                      Added to your inventory supplies. Usable in dungeons & battles!
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                      Ancient Gold Hoard!
                    </span>

                    <div className="w-28 h-28 mx-auto rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-6xl shadow-2xl shadow-amber-500/20">
                      💰
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono text-amber-400 uppercase">
                        Direct Treasury Bounty
                      </span>
                      <h3 className="text-2xl font-black text-amber-300 font-mono">
                        +{unboxedResult.coinsWon} Coins
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                        {unboxedResult.message}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200">
                      Credited directly to your expedition wallet!
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    setUnboxedResult(null);
                    sound.play('click');
                  }}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-colors"
                >
                  Collect & Continue
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Cosmetics Collection Browser */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white font-cinzel">Cosmetics Archive (100 Items)</h3>
            <p className="text-xs text-slate-400">
              Browse your unlocked items and discover locked silhouettes throughout the galaxy.
            </p>
          </div>

          {/* Special 20 Filter Toggle */}
          <button
            onClick={() => setActiveSpecialFilter(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSpecialFilter
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <span>⭐ View Only 20 Special Relics</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 shrink-0 mr-1">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg capitalize transition-colors ${
                activeCategoryFilter === cat
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Rarity Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 shrink-0 mr-1">Rarity:</span>
          {rarities.map(r => (
            <button
              key={r}
              onClick={() => setActiveRarityFilter(r)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
                activeRarityFilter === r
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Cosmetics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCosmetics.map(item => {
            const isOwned = unlockedCosmetics.includes(item.id);
            const rarityStyle = RARITY_COLORS[item.rarity];

            return (
              <div
                key={item.id}
                onClick={() => setInspectItem(item)}
                className={`cosmic-card cosmic-card-hover rounded-xl p-3 border flex flex-col justify-between text-left cursor-pointer transition-all relative overflow-hidden ${
                  isOwned
                    ? `${rarityStyle?.border || 'border-white/10'}`
                    : 'border-white/5 opacity-60 hover:opacity-85'
                }`}
              >
                {/* Special Tag */}
                {item.isSpecial && (
                  <span className="absolute top-2 right-2 text-[9px] bg-amber-500/90 text-slate-950 font-black px-1 rounded shadow">
                    SPECIAL
                  </span>
                )}

                {/* Cosmetic Icon or Locked Silhouette */}
                <div className="h-20 rounded-lg bg-slate-900/80 flex items-center justify-center text-3xl relative mb-2">
                  {isOwned ? (
                    <span className="filter drop-shadow-md">{item.icon}</span>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Lock className="w-5 h-5 text-slate-500 mb-0.5" />
                      <span className="text-[10px]">Locked</span>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${rarityStyle?.text}`}>{item.rarity}</span>
                    <span className="text-slate-500 capitalize">{item.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">
                    {isOwned ? item.name : 'Unknown Relic'}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Inspect Modal */}
      {inspectItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectItem(null)}
        >
          <div
            className="cosmic-card max-w-sm w-full rounded-2xl p-6 border border-white/20 text-center space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mx-auto py-2">
              {unlockedCosmetics.includes(inspectItem.id) ? inspectItem.icon : '🔒'}
            </div>
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${RARITY_COLORS[inspectItem.rarity]?.text}`}>
                {inspectItem.rarity} {inspectItem.category.toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-white mt-1 font-cinzel">
                {unlockedCosmetics.includes(inspectItem.id) ? inspectItem.name : 'Encrypted Cosmic Relic'}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {unlockedCosmetics.includes(inspectItem.id)
                  ? inspectItem.description
                  : `This ${inspectItem.rarity} tier ${inspectItem.category} has not yet been unlocked. Find it by opening chests or purchasing it in the shop.`}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
              <span>{inspectItem.isSpecial ? '⭐ 1 of 20 Ultra Rares' : 'Standard Collection'}</span>
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
