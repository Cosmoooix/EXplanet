import React from 'react';
import { useGame } from '../context/GameContext';
import { Volume2, VolumeX, Sparkles, Shield, Coins, Compass } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenSettings }) => {
  const { player, soundEnabled, toggleSound, hasActiveShield } = useGame();

  const navLinks = [
    { id: 'dashboard', label: 'Command Hub' },
    { id: 'dungeon', label: 'Infinite Dungeon' },
    { id: 'survival', label: 'Solo Survival' },
    { id: 'recall', label: 'Active Recall' },
    { id: 'chests', label: 'Cosmetics & Chests' },
    { id: 'shop', label: 'Shop' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'trading', label: 'Trading Floor' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080a14]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark with Official EXPlanet Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <img
            src="/assets/aistudio/image_8b4ae633.png"
            alt="Official EXPlanet Logo"
            className="h-7 w-auto object-contain rounded bg-white p-0.5"
          />
          <span className="font-cinzel text-lg tracking-wider text-slate-100">
            EXPLANET
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              currentTab === 'dashboard' ? 'text-white font-semibold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('dungeon')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              currentTab === 'dungeon' ? 'text-white font-semibold' : ''
            }`}
          >
            Dungeon
          </button>
          <button
            onClick={() => onNavigate('survival')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              currentTab === 'survival' ? 'text-white font-semibold' : ''
            }`}
          >
            Survival
          </button>
          <button
            onClick={() => onNavigate('recall')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              currentTab === 'recall' ? 'text-white font-semibold' : ''
            }`}
          >
            Active Recall
          </button>
          <button
            onClick={() => onNavigate('chests')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              currentTab === 'chests' ? 'text-white font-semibold' : ''
            }`}
          >
            Chests
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              currentTab === 'shop' ? 'text-white font-semibold' : ''
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => onNavigate('trading')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              currentTab === 'trading' ? 'text-white font-semibold' : ''
            }`}
          >
            Trading
          </button>
        </nav>

        {/* Zone 3: Player Resources & Controls */}
        <div className="flex items-center gap-2.5 shrink-0 text-xs">
          {/* Active shield indicator */}
          {hasActiveShield && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-sky-300 bg-sky-950/40 border border-sky-600/30 px-2 py-1 rounded-md">
              <Shield className="w-3 h-3 text-sky-400" />
              <span>Shielded</span>
            </div>
          )}

          {/* Coins Display */}
          <button
            onClick={() => onNavigate('shop')}
            className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:border-white/10 transition-colors"
            title="Coins"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono tabular-nums text-xs font-semibold">{player.coins.toLocaleString()}</span>
          </button>

          {/* Player Level Badge */}
          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-1 bg-slate-900 border border-white/5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:border-white/10 transition-colors"
            title="Player Level"
          >
            <span className="text-[10px] text-slate-500">LVL</span>
            <span className="font-mono tabular-nums text-xs font-bold text-slate-100">{player.level}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-white/5"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="hidden sm:inline-flex items-center px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg transition-colors whitespace-nowrap"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Sub-Navigation for touch screens */}
      <div className="lg:hidden flex items-center gap-3 overflow-x-auto pt-2 pb-1 text-xs scrollbar-none">
        {navLinks.map(link => (
          <button
            key={link.id}
            onClick={() => onNavigate(link.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md transition-colors ${
              currentTab === link.id
                ? 'bg-purple-600 text-white font-medium'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
