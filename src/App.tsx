import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { InfiniteDungeon } from './components/InfiniteDungeon';
import { SoloSurvival } from './components/SoloSurvival';
import { ActiveRecall } from './components/ActiveRecall';
import { ChestsView } from './components/ChestsView';
import { ShopView } from './components/ShopView';
import { InventoryView } from './components/InventoryView';
import { LeaderboardView } from './components/LeaderboardView';
import { AchievementsView } from './components/AchievementsView';
import { TradingView } from './components/TradingView';
import { SettingsModal } from './components/SettingsModal';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen cosmic-bg text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={tab => setCurrentTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={tab => setCurrentTab(tab)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {currentTab === 'dungeon' && (
          <InfiniteDungeon onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'survival' && (
          <SoloSurvival onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'recall' && (
          <ActiveRecall onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'chests' && (
          <ChestsView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'shop' && (
          <ShopView
            onNavigateToInventory={() => setCurrentTab('inventory')}
            onNavigateToChests={() => setCurrentTab('chests')}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView onNavigateToShop={() => setCurrentTab('shop')} />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'achievements' && (
          <AchievementsView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'trading' && (
          <TradingView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <p className="font-cinzel tracking-wider text-slate-400">
          EXPLANET &copy; 2026 · Educational Space RPG · Pure Programmed Knowledge
        </p>
        <div className="flex justify-center items-center gap-4 text-slate-500">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="hover:text-slate-300 transition-colors"
          >
            Hub
          </button>
          <span>·</span>
          <button
            onClick={() => setCurrentTab('dungeon')}
            className="hover:text-slate-300 transition-colors"
          >
            Infinite Dungeon
          </button>
          <span>·</span>
          <button
            onClick={() => setCurrentTab('recall')}
            className="hover:text-slate-300 transition-colors"
          >
            Active Recall
          </button>
          <span>·</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-slate-300 transition-colors"
          >
            Settings & Save
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
