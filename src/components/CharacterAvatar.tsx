import React from 'react';
import { EquippedCosmetics } from '../types/game';
import { COSMETICS_DATABASE, RARITY_COLORS } from '../data/cosmetics';

interface CharacterAvatarProps {
  avatarBase: string;
  equipped: EquippedCosmetics;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  avatarBase,
  equipped,
  size = 'md',
  showDetails = false,
}) => {
  const hatItem = COSMETICS_DATABASE.find(c => c.id === equipped.hat);
  const hairItem = COSMETICS_DATABASE.find(c => c.id === equipped.hair);
  const maskItem = COSMETICS_DATABASE.find(c => c.id === equipped.mask);
  const outfitItem = COSMETICS_DATABASE.find(c => c.id === equipped.outfit);
  const weaponItem = COSMETICS_DATABASE.find(c => c.id === equipped.weapon);
  const petItem = COSMETICS_DATABASE.find(c => c.id === equipped.pet);
  const trailItem = COSMETICS_DATABASE.find(c => c.id === equipped.trail);
  const auraItem = COSMETICS_DATABASE.find(c => c.id === equipped.aura);

  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-32 h-32 text-6xl',
    xl: 'w-44 h-44 text-8xl',
  };

  const auraGlow = auraItem?.glowColor || 'rgba(124, 58, 237, 0.25)';

  return (
    <div className="relative inline-flex items-center justify-center select-none group">
      {/* Dynamic Aura Ring */}
      {auraItem && (
        <div
          className="absolute inset-0 rounded-full animate-pulse blur-md opacity-75 transition-all pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${auraGlow} 0%, transparent 70%)`,
            transform: 'scale(1.4)',
          }}
        />
      )}

      {/* Main Container */}
      <div
        className={`relative ${sizeClasses[size]} rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/95 border border-slate-700/60 shadow-xl flex items-center justify-center overflow-visible transition-transform duration-200 group-hover:scale-105`}
        style={{
          boxShadow: auraItem ? `0 0 25px ${auraGlow}` : undefined,
        }}
      >
        {/* Background Trail or Wings */}
        {trailItem && (
          <div className="absolute -top-2 -left-2 text-xl opacity-90 animate-bounce pointer-events-none">
            {trailItem.icon}
          </div>
        )}

        {/* Base Avatar */}
        <span className="relative z-10 filter drop-shadow-md">{avatarBase || '🧑‍🚀'}</span>

        {/* Hat / Headgear overlay */}
        {hatItem && (
          <span
            className="absolute -top-3 z-20 filter drop-shadow-lg transform -rotate-3 text-lg sm:text-2xl"
            title={`Hat: ${hatItem.name}`}
          >
            {hatItem.icon}
          </span>
        )}

        {/* Mask Overlay */}
        {maskItem && (
          <span
            className="absolute z-20 text-xs sm:text-sm filter drop-shadow"
            title={`Mask: ${maskItem.name}`}
          >
            {maskItem.icon}
          </span>
        )}

        {/* Outfit Indicator Badge */}
        {outfitItem && (
          <span
            className="absolute -bottom-1 z-20 text-xs filter drop-shadow bg-slate-900/90 rounded-full px-1 border border-slate-700"
            title={`Outfit: ${outfitItem.name}`}
          >
            {outfitItem.icon}
          </span>
        )}

        {/* Weapon Held */}
        {weaponItem && (
          <span
            className="absolute -right-3 -bottom-1 z-20 text-base sm:text-xl filter drop-shadow-md transform rotate-12"
            title={`Weapon: ${weaponItem.name}`}
          >
            {weaponItem.icon}
          </span>
        )}

        {/* Floating Pet Companion */}
        {petItem && (
          <span
            className="absolute -left-3.5 -bottom-2 z-20 text-base sm:text-xl filter drop-shadow animate-pulse"
            title={`Pet: ${petItem.name}`}
          >
            {petItem.icon}
          </span>
        )}
      </div>

      {/* Optional details tooltip */}
      {showDetails && (
        <div className="absolute top-full mt-2 w-48 text-center text-xs text-slate-400 bg-slate-900/90 border border-slate-800 rounded-lg p-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <p className="font-semibold text-slate-200">Equipped Gear</p>
          <p className="truncate">Hat: {hatItem?.name || 'None'}</p>
          <p className="truncate">Weapon: {weaponItem?.name || 'None'}</p>
          <p className="truncate">Pet: {petItem?.name || 'None'}</p>
        </div>
      )}
    </div>
  );
};
