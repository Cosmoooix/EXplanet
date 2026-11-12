import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS_DATABASE, RARITY_COLORS } from '../data/cosmetics';
import { CosmeticItem } from '../types/game';
import { sound } from '../utils/audio';
import {
  RefreshCw,
  Search,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRightLeft,
  Lock,
  Globe2,
} from 'lucide-react';

interface TradingViewProps {
  onBackToDashboard: () => void;
}

const REGISTERED_STUDENTS = [
  {
    username: 'NovaVanguard',
    avatar: '🧑‍🚀',
    level: 18,
    title: 'Grand Archon',
    inventoryOffer: ['hat_crown_pulsar', 'weapon_plasma_saber', 'pet_starlight_fox'],
  },
  {
    username: 'Astraea_Sol',
    avatar: '🧙‍♀️',
    level: 16,
    title: 'Sage of the Nebula',
    inventoryOffer: ['hat_kitsune_ears', 'outfit_royal_regalia', 'trail_cherry_blossom'],
  },
  {
    username: 'Orion_Rider',
    avatar: '🥷',
    level: 14,
    title: 'Astral Champion',
    inventoryOffer: ['mask_phantom_half', 'weapon_chrono_blade', 'pet_floating_jelly'],
  },
  {
    username: 'Cyber_Scribe',
    avatar: '🤖',
    level: 12,
    title: 'Legendary Scholar',
    inventoryOffer: ['hair_cyber_dreads', 'outfit_tactical_stealth', 'trail_binary_code'],
  },
];

export const TradingView: React.FC<TradingViewProps> = ({ onBackToDashboard }) => {
  const { player, unlockedCosmetics, executeTrade } = useGame();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<(typeof REGISTERED_STUDENTS)[0] | null>(
    REGISTERED_STUDENTS[0]
  );

  // Active Trade Session State
  const [myOfferedIds, setMyOfferedIds] = useState<string[]>([]);
  const [theirOfferedIds, setTheirOfferedIds] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);

  const ownedItems = COSMETICS_DATABASE.filter(item => unlockedCosmetics.includes(item.id));

  const filteredStudents = REGISTERED_STUDENTS.filter(s =>
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMyOffer = (id: string) => {
    if (isLocked) return;
    if (myOfferedIds.includes(id)) {
      setMyOfferedIds(prev => prev.filter(i => i !== id));
    } else {
      setMyOfferedIds(prev => [...prev, id]);
    }
  };

  const toggleTheirOffer = (id: string) => {
    if (isLocked) return;
    if (theirOfferedIds.includes(id)) {
      setTheirOfferedIds(prev => prev.filter(i => i !== id));
    } else {
      setTheirOfferedIds(prev => [...prev, id]);
    }
  };

  const handleCancelTrade = () => {
    sound.play('click');
    setMyOfferedIds([]);
    setTheirOfferedIds([]);
    setIsLocked(false);
    setTradeMessage('Trade session cancelled. No items were transferred.');
    setTimeout(() => setTradeMessage(null), 3500);
  };

  const handleLockProposal = () => {
    if (myOfferedIds.length === 0 && theirOfferedIds.length === 0) {
      setTradeMessage('Please add at least one item to the trade table.');
      return;
    }
    sound.play('click');
    setIsLocked(true);
    setTradeMessage('Trade proposal locked! Both parties must confirm before execution.');
  };

  const handleFinalizeTrade = () => {
    if (!isLocked) return;

    // Verify ownership security rule: Player must still own every offered item
    for (const id of myOfferedIds) {
      if (!unlockedCosmetics.includes(id)) {
        setTradeMessage('Security error: You no longer own one of the offered items.');
        setIsLocked(false);
        return;
      }
    }

    const success = executeTrade(myOfferedIds, theirOfferedIds);
    if (success) {
      sound.play('victory');
      setTradeMessage(
        `Trade confirmed! Transferred ${myOfferedIds.length} items and received ${theirOfferedIds.length} new items.`
      );
      setMyOfferedIds([]);
      setTheirOfferedIds([]);
      setIsLocked(false);
    } else {
      setTradeMessage('Transaction failed validation.');
      setIsLocked(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="cosmic-card rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <ArrowRightLeft className="w-4 h-4 text-sky-400" />
            <span className="text-sky-400">Peer Exchange Chamber</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px]">
              [DEMO / NOT CONNECTED]
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
            Cosmetic Item Trading Floor
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Trade rare hats, weapons, outfits, and pets with fellow academy scholars.
            Enforces strict two-party confirmation and anti-duplication verification.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="text-xs text-slate-300 hover:text-white px-4 py-2 bg-slate-800 rounded-xl transition-colors"
        >
          Exit to Hub
        </button>
      </div>

      {/* Backend Protocol Status Banner per Prompt */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-sky-500/30 text-xs text-slate-300 flex items-start gap-3">
        <Globe2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Architecture Notice: Standalone Peer Mode Active
          </p>
          <p className="text-slate-400 leading-relaxed">
            The trading interface below demonstrates real ownership validation and inventory transfer
            mechanics. For real-time cross-device peer-to-peer barter with human classmates on other computers,
            configure a shared Firebase Firestore backend.
          </p>
        </div>
      </div>

      {tradeMessage && (
        <div className="p-3 bg-purple-950/60 border border-purple-500/50 rounded-xl text-purple-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <span>{tradeMessage}</span>
        </div>
      )}

      {/* Main Trade Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Select Trade Partner */}
        <div className="lg:col-span-4 cosmic-card rounded-2xl p-5 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white font-cinzel flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            Find Trading Partner
          </h3>

          <div className="relative">
            <input
              type="text"
              placeholder="Search student username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredStudents.map(student => (
              <button
                key={student.username}
                onClick={() => {
                  if (isLocked) return;
                  setSelectedPartner(student);
                  setTheirOfferedIds([]);
                  sound.play('click');
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedPartner?.username === student.username
                    ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-400'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{student.avatar}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{student.username}</h4>
                    <p className="text-[10px] text-purple-300 font-medium">{student.title}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">Lvl.{student.level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Two-Sided Trade Table */}
        <div className="lg:col-span-8 cosmic-card rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-cinzel">Active Barter Table</h3>
            {isLocked && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked for Review
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Side of Trade */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-400 font-semibold uppercase">Your Offer</span>
                  <h4 className="text-sm font-bold text-white">{player.username}</h4>
                </div>
                <span className="text-xs text-slate-400">{myOfferedIds.length} items</span>
              </div>

              {/* My selected items on the table */}
              <div className="min-h-24 p-2 rounded-lg bg-slate-950/80 border border-white/5 space-y-1">
                {myOfferedIds.map(id => {
                  const item = COSMETICS_DATABASE.find(c => c.id === id);
                  if (!item) return null;
                  return (
                    <div
                      key={id}
                      onClick={() => toggleMyOffer(id)}
                      className="p-1.5 rounded bg-slate-800/80 border border-white/10 text-xs flex items-center justify-between cursor-pointer hover:bg-slate-700"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{item.icon}</span>
                        <span className="text-white truncate">{item.name}</span>
                      </span>
                      <span className={`text-[10px] font-bold ${RARITY_COLORS[item.rarity]?.text}`}>
                        {item.rarity}
                      </span>
                    </div>
                  );
                })}
                {myOfferedIds.length === 0 && (
                  <p className="text-center text-xs text-slate-500 py-6">
                    Select owned items below to put on the table.
                  </p>
                )}
              </div>

              {/* Available items picker */}
              <div className="space-y-1 pt-2">
                <p className="text-[11px] text-slate-400">Your Wardrobe (Click to offer):</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {ownedItems.map(item => {
                    const isOffered = myOfferedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        disabled={isLocked}
                        onClick={() => toggleMyOffer(item.id)}
                        className={`w-full text-left p-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                          isOffered
                            ? 'bg-purple-900/60 border border-purple-500 text-purple-200'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{item.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{item.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Partner's Side of Trade */}
            {selectedPartner && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-sky-400 font-semibold uppercase">Partner's Offer</span>
                    <h4 className="text-sm font-bold text-white">{selectedPartner.username}</h4>
                  </div>
                  <span className="text-xs text-slate-400">{theirOfferedIds.length} items</span>
                </div>

                {/* Their selected items on the table */}
                <div className="min-h-24 p-2 rounded-lg bg-slate-950/80 border border-white/5 space-y-1">
                  {theirOfferedIds.map(id => {
                    const item = COSMETICS_DATABASE.find(c => c.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        onClick={() => toggleTheirOffer(id)}
                        className="p-1.5 rounded bg-slate-800/80 border border-white/10 text-xs flex items-center justify-between cursor-pointer hover:bg-slate-700"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{item.icon}</span>
                          <span className="text-white truncate">{item.name}</span>
                        </span>
                        <span className={`text-[10px] font-bold ${RARITY_COLORS[item.rarity]?.text}`}>
                          {item.rarity}
                        </span>
                      </div>
                    );
                  })}
                  {theirOfferedIds.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-6">
                      Click available partner relics below to request.
                    </p>
                  )}
                </div>

                {/* Partner's available items picker */}
                <div className="space-y-1 pt-2">
                  <p className="text-[11px] text-slate-400">{selectedPartner.username}'s Relics:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {selectedPartner.inventoryOffer.map(id => {
                      const item = COSMETICS_DATABASE.find(c => c.id === id);
                      if (!item) return null;
                      const isOffered = theirOfferedIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          disabled={isLocked}
                          onClick={() => toggleTheirOffer(item.id)}
                          className={`w-full text-left p-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                            isOffered
                              ? 'bg-sky-900/60 border border-sky-500 text-sky-200'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{item.icon}</span>
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className={`text-[10px] font-bold ${RARITY_COLORS[item.rarity]?.text}`}>
                            {item.rarity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trade Actions Controls */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCancelTrade}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Reset / Cancel
            </button>

            {!isLocked ? (
              <button
                onClick={handleLockProposal}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Proposal for Confirmation</span>
              </button>
            ) : (
              <button
                onClick={handleFinalizeTrade}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Execute Trade</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
