import React, { useRef, useEffect } from 'react';
import { drawPixelMatrix, PIXEL_PALETTE, MONSTER_SPRITES, PLAYER_SPRITES, OBJECT_SPRITES } from './pixelSprites';

interface PixelSpriteViewProps {
  spriteType:
    | 'slime'
    | 'skeleton'
    | 'void_imp'
    | 'mini_boss_golem'
    | 'boss_dragon'
    | 'player_idle'
    | 'chest_closed'
    | 'chest_open'
    | 'npc_sage';
  scale?: number;
  className?: string;
}

export const PixelSpriteView: React.FC<PixelSpriteViewProps> = ({
  spriteType,
  scale = 4,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    let matrix = MONSTER_SPRITES.slime;
    if (spriteType === 'skeleton') matrix = MONSTER_SPRITES.skeleton;
    else if (spriteType === 'void_imp') matrix = MONSTER_SPRITES.void_imp;
    else if (spriteType === 'mini_boss_golem') matrix = MONSTER_SPRITES.mini_boss_golem;
    else if (spriteType === 'boss_dragon') matrix = MONSTER_SPRITES.boss_dragon;
    else if (spriteType === 'player_idle') matrix = PLAYER_SPRITES.down_idle;
    else if (spriteType === 'chest_closed') matrix = OBJECT_SPRITES.chest_closed;
    else if (spriteType === 'chest_open') matrix = OBJECT_SPRITES.chest_open;
    else if (spriteType === 'npc_sage') matrix = OBJECT_SPRITES.npc_sage;

    drawPixelMatrix(ctx, matrix, PIXEL_PALETTE, 0, 0, scale);
  }, [spriteType, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={16 * scale}
      height={16 * scale}
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
