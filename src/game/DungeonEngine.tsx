import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  drawPixelMatrix,
  PLAYER_SPRITES,
  MONSTER_SPRITES,
  OBJECT_SPRITES,
  TILE_SPRITES,
  PIXEL_PALETTE,
} from './pixelSprites';
import { sound } from '../utils/audio';
import { RoomType, Subject } from '../types/game';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand, Pause, Play, ShieldAlert, Sparkles, Lock } from 'lucide-react';

export type EntityType = 'player' | 'monster' | 'chest' | 'door' | 'npc' | 'pillar';

export interface GameEntity {
  id: string;
  type: EntityType;
  x: number; // in tile units (float)
  y: number; // in tile units (float)
  subType?: string; // 'slime' | 'skeleton' | 'imp' | 'mini_boss_golem' | 'boss_dragon'
  name: string;
  isOpened?: boolean;
  hp?: number;
  maxHp?: number;
  atk?: number;
  isDefeated?: boolean;
  isChasing?: boolean;
  doorDirection?: 'north' | 'east' | 'south' | 'west';
  doorSubject?: Subject | 'Mixed';
  targetRoomIndex?: number;
  isSealedByBoss?: boolean;
  isBoss?: boolean;
  isMiniBoss?: boolean;
}

interface DungeonEngineProps {
  floor: number;
  roomNumber: number;
  roomType: RoomType;
  onEngageMonster: (monsterEntity: GameEntity) => void;
  onOpenChest: (chestEntity: GameEntity) => void;
  onAttemptDoor: (doorEntity: GameEntity) => void;
  onInteractNpc: () => void;
  activeBattleMonsterId?: string | null;
  onBossSpawned?: (bossEntity: GameEntity) => void;
  isCombatActive?: boolean;
  hasActiveSpeedBoost?: boolean;
}

const TILE_SIZE = 32; // 32x32 pixel tiles on screen
const MAP_COLS = 18;
const MAP_ROWS = 12;

export const DungeonEngine: React.FC<DungeonEngineProps> = ({
  floor,
  roomNumber,
  roomType,
  onEngageMonster,
  onOpenChest,
  onAttemptDoor,
  onInteractNpc,
  activeBattleMonsterId,
  onBossSpawned,
  isCombatActive = false,
  hasActiveSpeedBoost = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Callback refs to prevent unwanted re-renders/resets
  const onBossSpawnedRef = useRef(onBossSpawned);
  onBossSpawnedRef.current = onBossSpawned;

  const onEngageMonsterRef = useRef(onEngageMonster);
  onEngageMonsterRef.current = onEngageMonster;

  const onOpenChestRef = useRef(onOpenChest);
  onOpenChestRef.current = onOpenChest;

  const onAttemptDoorRef = useRef(onAttemptDoor);
  onAttemptDoorRef.current = onAttemptDoor;

  const onInteractNpcRef = useRef(onInteractNpc);
  onInteractNpcRef.current = onInteractNpc;

  // Track room key to ensure a room is generated EXACTLY ONCE on entry
  const lastRoomKeyRef = useRef<string>('');

  // Player state with continuous sub-tile position
  const playerPosRef = useRef<{ x: number; y: number }>({ x: 2.5, y: 6 });
  const [playerDirection, setPlayerDirection] = useState<'down' | 'up' | 'left' | 'right'>('right');
  const [walkFrame, setWalkFrame] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Active keyboard inputs
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Dynamic entities on the floor (monsters chase, chests open)
  const entitiesRef = useRef<GameEntity[]>([]);
  const [renderedEntities, setRenderedEntities] = useState<GameEntity[]>([]);

  // Nearby interaction prompt
  const [nearbyAction, setNearbyAction] = useState<{
    text: string;
    action: () => void;
  } | null>(null);

  // Map tile matrix (0 = floor, 1 = brick wall, 2 = torch wall, 3 = cracked floor, 4 = void pit, 5 = red carpet, 6 = water pool)
  const mapGridRef = useRef<number[][]>([]);

  // Setup rich, unique room layouts, obstacles, multiple doors, and ALWAYS chasing monsters
  useEffect(() => {
    const roomKey = `${floor}_${roomNumber}_${roomType}`;
    if (lastRoomKeyRef.current === roomKey) {
      // Room already initialized! Do NOT reset entities or player position!
      return;
    }
    lastRoomKeyRef.current = roomKey;

    const grid: number[][] = [];
    const isBossRoom = roomType === 'boss' || roomNumber === 5;
    const isMiniBossRoom = roomNumber === 3;
    const layoutVariant = (floor * 3 + roomNumber) % 5;

    for (let r = 0; r < MAP_ROWS; r++) {
      const row: number[] = [];
      for (let c = 0; c < MAP_COLS; c++) {
        // Perimeter walls
        if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
          if (r === 0 && (c === 4 || c === 9 || c === 13)) {
            row.push(2); // Torch wall
          } else {
            row.push(1); // Brick wall
          }
        } else {
          // Interior unique layouts based on chamber archetype
          if (isBossRoom) {
            // Sovereign Throne Room: Grand red carpet along center aisle (c=8,9), decorative pillars
            if ((c === 8 || c === 9) && r >= 2 && r <= 9) {
              row.push(5); // Red carpet
            } else if ((r === 3 || r === 8) && (c === 4 || c === 13)) {
              row.push(1); // Solid ornate pillar
            } else if ((r + c) % 5 === 0) {
              row.push(3); // Cracked stone
            } else {
              row.push(0);
            }
          } else if (isMiniBossRoom) {
            // The Sunken Arena: Center fighting ring surrounded by low barrier pillars
            const isRing = (r === 3 || r === 8) && c >= 5 && c <= 12 && c !== 8 && c !== 9;
            const isRingSide = (c === 5 || c === 12) && r >= 4 && r <= 7 && r !== 5 && r !== 6;
            if (isRing || isRingSide) {
              row.push(1); // Stone arena perimeter
            } else if (r >= 4 && r <= 7 && c >= 6 && c <= 11) {
              row.push(r % 2 === 0 ? 3 : 0); // Arena floor
            } else {
              row.push(0);
            }
          } else if (layoutVariant === 0) {
            // Layout 0: The Twin Chasm Bridges: Wide vertical void abyss with two stone crossing bridges
            if ((c === 8 || c === 9) && (r < 3 || (r > 4 && r < 7) || r > 8)) {
              row.push(4); // Void abyss
            } else if ((c === 8 || c === 9) && (r === 3 || r === 4 || r === 7 || r === 8)) {
              row.push(0); // Stone crossing bridge
            } else if ((r + c) % 4 === 0) {
              row.push(3);
            } else {
              row.push(0);
            }
          } else if (layoutVariant === 1) {
            // Layout 1: The Astral Crossroads (Corner chasms with central water shrine)
            const isCornerChasm =
              (r <= 3 && c <= 4) ||
              (r <= 3 && c >= 13) ||
              (r >= 8 && c <= 4) ||
              (r >= 8 && c >= 13);
            const isWaterShrine = (r === 5 || r === 6) && (c === 8 || c === 9);

            if (isCornerChasm) {
              row.push(4); // Deep starry void
            } else if (isWaterShrine) {
              row.push(6); // Arcane water pool
            } else {
              row.push((r + c) % 5 === 0 ? 3 : 0);
            }
          } else if (layoutVariant === 2) {
            // Layout 2: The Colonnade of Four Grand Pillars
            if ((r === 3 || r === 8) && (c === 5 || c === 12)) {
              row.push(1); // Solid Pillar
            } else if ((r === 4 || r === 7) && (c === 8 || c === 9)) {
              row.push(3);
            } else {
              row.push((r * 2 + c) % 6 === 0 ? 3 : 0);
            }
          } else if (layoutVariant === 3) {
            // Layout 3: The Ancient Library Labyrinth (Winding corridors)
            if (
              (r === 3 && c >= 4 && c <= 8) ||
              (r === 8 && c >= 9 && c <= 13) ||
              (r === 6 && c >= 6 && c <= 11 && c !== 8)
            ) {
              row.push(1); // Bookshelf / divider barrier
            } else {
              row.push((r + c) % 4 === 0 ? 3 : 0);
            }
          } else {
            // Layout 4: The Sanctuary of Reflection (Water channels with stone footpaths)
            if ((c === 4 || c === 13) && r >= 3 && r <= 8) {
              row.push(6); // Sacred water pool
            } else {
              row.push((r + c) % 5 === 0 ? 3 : 0);
            }
          }
        }
      }
      grid.push(row);
    }
    mapGridRef.current = grid;

    // Place Unique Branching Doors (All with questions!)
    const newEntities: GameEntity[] = [];
    const hasBossOrMiniBoss = isBossRoom || isMiniBossRoom;

    // Door 1: East Door (Primary passage)
    newEntities.push({
      id: `door_east_${roomNumber}`,
      type: 'door',
      x: MAP_COLS - 2,
      y: 6,
      doorDirection: 'east',
      doorSubject: 'Mathematics',
      targetRoomIndex: roomNumber + 1,
      name: isBossRoom ? `Floor ${floor + 1} Sovereign Gateway` : `East Portal (Math Cipher)`,
      isSealedByBoss: hasBossOrMiniBoss,
    });

    // Door 2: North Door (Alternative branch)
    newEntities.push({
      id: `door_north_${roomNumber}`,
      type: 'door',
      x: 9,
      y: 1,
      doorDirection: 'north',
      doorSubject: 'Science',
      targetRoomIndex: roomNumber + 1,
      name: `North Sanctuary (Science Gate)`,
      isSealedByBoss: hasBossOrMiniBoss,
    });

    // Door 3: South Door (English Lore portal)
    if (!isBossRoom) {
      newEntities.push({
        id: `door_south_${roomNumber}`,
        type: 'door',
        x: 9,
        y: MAP_ROWS - 2,
        doorDirection: 'south',
        doorSubject: 'English',
        targetRoomIndex: roomNumber + 1,
        name: `South Archive (English Archway)`,
        isSealedByBoss: hasBossOrMiniBoss,
      });
    }

    // Spawn Monsters (Relentlessly chase the player!)
    let spawnedBoss: GameEntity | null = null;

    if (isBossRoom) {
      // Floor Sovereign Boss
      const boss: GameEntity = {
        id: `boss_${floor}`,
        type: 'monster',
        x: 12,
        y: 6,
        subType: 'boss_dragon',
        name: `Abyssal Dragon Titan (Floor ${floor})`,
        hp: 200 + floor * 40,
        maxHp: 200 + floor * 40,
        atk: 25 + floor * 5,
        isDefeated: false,
        isChasing: true, // ALWAYS chases!
        isBoss: true,
      };
      newEntities.push(boss);
      spawnedBoss = boss;
    } else if (isMiniBossRoom) {
      // Mini-Boss Encounter: Ancient Void Golem Sentry
      const miniBoss: GameEntity = {
        id: `miniboss_${floor}_${roomNumber}`,
        type: 'monster',
        x: 10,
        y: 5.5,
        subType: 'mini_boss_golem',
        name: `Obsidian Void Golem (Mini-Boss F${floor})`,
        hp: 110 + floor * 25,
        maxHp: 110 + floor * 25,
        atk: 18 + floor * 3,
        isDefeated: false,
        isChasing: true, // ALWAYS chases!
        isMiniBoss: true,
      };
      newEntities.push(miniBoss);
      spawnedBoss = miniBoss;

      // Add a support minion
      newEntities.push({
        id: `minion_${floor}_${roomNumber}`,
        type: 'monster',
        x: 13,
        y: 8,
        subType: 'void_imp',
        name: 'Shadow Imp Attendant',
        hp: 35 + floor * 10,
        maxHp: 35 + floor * 10,
        atk: 10 + floor * 2,
        isDefeated: false,
        isChasing: true, // ALWAYS chases!
      });
    } else if (roomType === 'monster') {
      const monsterTypes = ['slime', 'skeleton', 'void_imp'];
      const m1 = monsterTypes[(floor + roomNumber) % monsterTypes.length];
      const m2 = monsterTypes[(floor + roomNumber + 1) % monsterTypes.length];

      newEntities.push({
        id: `monster_${floor}_${roomNumber}_1`,
        type: 'monster',
        x: 8.5,
        y: 4,
        subType: m1,
        name: m1 === 'slime' ? 'Astral Slime' : m1 === 'skeleton' ? 'Skeleton Warrior' : 'Void Imp',
        hp: 40 + floor * 12,
        maxHp: 40 + floor * 12,
        atk: 12 + floor * 2,
        isDefeated: false,
        isChasing: true, // ALWAYS chases!
      });

      // Second monster in deeper floors
      if (floor >= 2 || roomNumber >= 2) {
        newEntities.push({
          id: `monster_${floor}_${roomNumber}_2`,
          type: 'monster',
          x: 13,
          y: 7.5,
          subType: m2,
          name: m2 === 'slime' ? 'Nebula Slime' : m2 === 'skeleton' ? 'Bone Guard' : 'Shadow Imp',
          hp: 45 + floor * 12,
          maxHp: 45 + floor * 12,
          atk: 13 + floor * 2,
          isDefeated: false,
          isChasing: true, // ALWAYS chases!
        });
      }

      // Treasure Chest
      newEntities.push({
        id: `chest_${roomNumber}`,
        type: 'chest',
        x: 14.5,
        y: 2.5,
        name: 'Dungeon Cache',
        isOpened: false,
      });
    } else if (roomType === 'treasure') {
      newEntities.push({
        id: 'vault_chest_1',
        type: 'chest',
        x: 6,
        y: 5,
        name: 'Celestial Relic Chest',
        isOpened: false,
      });
      newEntities.push({
        id: 'vault_chest_2',
        type: 'chest',
        x: 12,
        y: 7,
        name: 'Ancient Gilded Cache',
        isOpened: false,
      });
    } else if (roomType === 'rest') {
      newEntities.push({
        id: 'npc_sage',
        type: 'npc',
        x: 9,
        y: 5,
        name: 'Hermit Sage',
      });
    }

    entitiesRef.current = newEntities;
    setRenderedEntities([...newEntities]);

    // Spawn player in safe entrance zone on the left
    playerPosRef.current = { x: 2.5, y: 6 };
    setPlayerDirection('right');

    if (spawnedBoss && onBossSpawnedRef.current) {
      onBossSpawnedRef.current(spawnedBoss);
    }
  }, [floor, roomNumber, roomType]);

  // Handle defeated monster sync and unseal doors when Boss or Mini-Boss is defeated
  useEffect(() => {
    if (activeBattleMonsterId) {
      entitiesRef.current = entitiesRef.current.map(ent => {
        if (ent.id === activeBattleMonsterId) {
          return { ...ent, isDefeated: true, isChasing: false };
        }
        return ent;
      });

      // Check if any boss or mini-boss is still alive
      const remainingBoss = entitiesRef.current.find(
        e => (e.isBoss || e.isMiniBoss) && !e.isDefeated
      );

      // If no boss remains alive, shatter the door seal!
      if (!remainingBoss) {
        entitiesRef.current = entitiesRef.current.map(ent =>
          ent.type === 'door' ? { ...ent, isSealedByBoss: false } : ent
        );
      }

      setRenderedEntities([...entitiesRef.current]);
    }
  }, [activeBattleMonsterId]);

  // Wall collision check against continuous bounding box
  const checkWallCollision = useCallback((x: number, y: number, radius: number = 0.35): boolean => {
    const grid = mapGridRef.current;
    if (!grid.length) return true;

    // Check surrounding 4 boundary corners of player
    const minCol = Math.floor(x - radius);
    const maxCol = Math.floor(x + radius);
    const minRow = Math.floor(y - radius);
    const maxRow = Math.floor(y + radius);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return true;
        const tile = grid[r]?.[c];
        // 1 = solid brick wall, 2 = solid torch wall, 4 = void pit, 6 = water pool
        if (tile === 1 || tile === 2 || tile === 4 || tile === 6) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;

      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault();
        if (nearbyAction) {
          nearbyAction.action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPaused(prev => !prev);
        sound.play('click');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyAction]);

  // 60 FPS Continuous Loop: Smooth Movement + Relentless Monster Chase AI (ALWAYS CHASING!)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let walkAnimAccumulator = 0;

    const gameLoop = (now: number) => {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      if (!isPaused && !isCombatActive) {
        // 1. Process Smooth Player Movement
        let dx = 0;
        let dy = 0;
        const keys = keysRef.current;

        if (keys['w'] || keys['arrowup'] || keys['keyw']) dy -= 1;
        if (keys['s'] || keys['arrowdown'] || keys['keys']) dy += 1;
        if (keys['a'] || keys['arrowleft'] || keys['keya']) dx -= 1;
        if (keys['d'] || keys['arrowright'] || keys['keyd']) dx += 1;

        if (dx !== 0 && dy !== 0) {
          const invLen = 1 / Math.SQRT2;
          dx *= invLen;
          dy *= invLen;
        }

        // When Swift Boots are active, player speed surges from 3.2 to 4.75 tiles/sec (outpacing all monsters!)
        const playerSpeed = hasActiveSpeedBoost ? 4.75 : 3.2;
        let currentPos = playerPosRef.current;

        if (dx !== 0 || dy !== 0) {
          if (Math.abs(dx) > Math.abs(dy)) {
            setPlayerDirection(dx > 0 ? 'right' : 'left');
          } else {
            setPlayerDirection(dy > 0 ? 'down' : 'up');
          }

          // Move X with slide collision
          const nextX = currentPos.x + dx * playerSpeed * dt;
          if (!checkWallCollision(nextX, currentPos.y)) {
            currentPos.x = nextX;
          }

          // Move Y with slide collision
          const nextY = currentPos.y + dy * playerSpeed * dt;
          if (!checkWallCollision(currentPos.x, nextY)) {
            currentPos.y = nextY;
          }

          // Walk animation cycle toggle
          walkAnimAccumulator += dt;
          if (walkAnimAccumulator > 0.16) {
            setWalkFrame(prev => (prev === 0 ? 1 : 0));
            walkAnimAccumulator = 0;
          }
        }

        // 2. Process Monsters: ALWAYS CHASE THE PLAYER relentlessly!
        // Monsters are FASTER than the player (Player: 3.2, Normal: 3.75, Mini-Boss: 4.1, Boss: 4.5)
        let engagedMonster: GameEntity | null = null;

        entitiesRef.current = entitiesRef.current.map(ent => {
          if (ent.type !== 'monster' || ent.isDefeated) return ent;

          const dist = Math.hypot(currentPos.x - ent.x, currentPos.y - ent.y);

          // Contact triggers battle encounter
          if (dist < 0.75 && !engagedMonster) {
            engagedMonster = ent;
          }

          // ALWAYS Chase mode! Monsters are FASTER than the scholar
          if (dist > 0.05) {
            const mdx = (currentPos.x - ent.x) / dist;
            const mdy = (currentPos.y - ent.y) / dist;

            // Varied chase speeds: Monsters are faster than player (3.2)
            const speed = ent.isBoss ? 4.5 : ent.isMiniBoss ? 4.1 : 3.75;

            let newMx = ent.x + mdx * speed * dt;
            let newMy = ent.y + mdy * speed * dt;

            // Slide against walls if obstacle in path
            if (checkWallCollision(newMx, ent.y, 0.4)) newMx = ent.x;
            if (checkWallCollision(ent.x, newMy, 0.4)) newMy = ent.y;

            return {
              ...ent,
              x: newMx,
              y: newMy,
              isChasing: true, // Always show targeting/alert
            };
          }

          return { ...ent, isChasing: true };
        });

        if (engagedMonster) {
          onEngageMonsterRef.current(engagedMonster);
        }

        // 3. Check Proximity Interactions
        let foundAction: { text: string; action: () => void } | null = null;

        for (const ent of entitiesRef.current) {
          const dist = Math.hypot(ent.x - currentPos.x, ent.y - currentPos.y);

          if (dist <= 1.4) {
            if (ent.type === 'door') {
              if (ent.isSealedByBoss) {
                foundAction = {
                  text: `🔒 ${ent.name} [SEALED BY BOSS]`,
                  action: () => onAttemptDoorRef.current(ent),
                };
              } else {
                foundAction = {
                  text: `[E] Unlock ${ent.name}`,
                  action: () => onAttemptDoorRef.current(ent),
                };
              }
              break;
            } else if (ent.type === 'chest' && !ent.isOpened) {
              foundAction = {
                text: `[E] Open ${ent.name}`,
                action: () => {
                  entitiesRef.current = entitiesRef.current.map(e =>
                    e.id === ent.id ? { ...e, isOpened: true } : e
                  );
                  onOpenChestRef.current(ent);
                },
              };
              break;
            } else if (ent.type === 'npc') {
              foundAction = {
                text: `[E] Speak to ${ent.name}`,
                action: () => onInteractNpcRef.current(),
              };
              break;
            } else if (ent.type === 'monster' && !ent.isDefeated) {
              foundAction = {
                text: `[E] Battle ${ent.name}`,
                action: () => onEngageMonsterRef.current(ent),
              };
              break;
            }
          }
        }
        setNearbyAction(foundAction);
      }

      // 4. Render Canvas Frame with crisp nearest-neighbor graphics
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;

          // Clear frame
          ctx.fillStyle = '#070814';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw Tiles
          const grid = mapGridRef.current;
          for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
              const tile = grid[r]?.[c] ?? 0;
              const px = c * TILE_SIZE;
              const py = r * TILE_SIZE;

              let tileMatrix = TILE_SPRITES.stone_floor;
              if (tile === 1) tileMatrix = TILE_SPRITES.wall_brick;
              else if (tile === 2) tileMatrix = TILE_SPRITES.wall_torch;
              else if (tile === 3) tileMatrix = TILE_SPRITES.stone_floor_cracked;
              else if (tile === 4) tileMatrix = TILE_SPRITES.void_pit;
              else if (tile === 5) tileMatrix = TILE_SPRITES.carpet_red;
              else if (tile === 6) tileMatrix = TILE_SPRITES.water_pool;

              drawPixelMatrix(ctx, tileMatrix, PIXEL_PALETTE, px, py, 2);
            }
          }

          // Draw Entities
          entitiesRef.current.forEach(ent => {
            const ex = Math.round(ent.x * TILE_SIZE);
            const ey = Math.round(ent.y * TILE_SIZE);

            if (ent.type === 'door') {
              const matrix = ent.isSealedByBoss
                ? OBJECT_SPRITES.door_locked_boss
                : OBJECT_SPRITES.door_open;
              drawPixelMatrix(ctx, matrix, PIXEL_PALETTE, ex, ey, 2);

              // Overhead Door Direction Tag & Seal Status
              ctx.fillStyle = ent.isSealedByBoss ? 'rgba(185, 28, 28, 0.85)' : 'rgba(7, 8, 20, 0.75)';
              ctx.fillRect(ex - 10, ey - 10, 52, 10);
              ctx.fillStyle = ent.isSealedByBoss ? '#fca5a5' : '#a78bfa';
              ctx.font = '8px monospace';
              ctx.fillText(ent.isSealedByBoss ? 'WARD LOCKED' : ent.doorSubject || 'DOOR', ex - 6, ey - 2);
            } else if (ent.type === 'chest') {
              const matrix = ent.isOpened
                ? OBJECT_SPRITES.chest_open
                : OBJECT_SPRITES.chest_closed;
              drawPixelMatrix(ctx, matrix, PIXEL_PALETTE, ex, ey, 2);
            } else if (ent.type === 'npc') {
              drawPixelMatrix(ctx, OBJECT_SPRITES.npc_sage, PIXEL_PALETTE, ex, ey, 2);
            } else if (ent.type === 'monster' && !ent.isDefeated) {
              let matrix = MONSTER_SPRITES.slime;
              if (ent.subType === 'skeleton') matrix = MONSTER_SPRITES.skeleton;
              else if (ent.subType === 'void_imp') matrix = MONSTER_SPRITES.void_imp;
              else if (ent.subType === 'mini_boss_golem') matrix = MONSTER_SPRITES.mini_boss_golem;
              else if (ent.subType === 'boss_dragon') matrix = MONSTER_SPRITES.boss_dragon;

              drawPixelMatrix(ctx, matrix, PIXEL_PALETTE, ex, ey, 2);

              // Overhead Health Bar
              if (ent.hp && ent.maxHp) {
                const hpRatio = Math.max(0, ent.hp / ent.maxHp);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(ex, ey - 6, TILE_SIZE, 3);
                ctx.fillStyle = ent.isBoss || ent.isMiniBoss ? '#f59e0b' : '#ef4444';
                ctx.fillRect(ex, ey - 6, TILE_SIZE * hpRatio, 3);
              }

              // Alert Bubble '!' because monsters are ALWAYS chasing you!
              drawPixelMatrix(ctx, OBJECT_SPRITES.alert_bubble, PIXEL_PALETTE, ex + 8, ey - 16, 1);
            }
          });

          // Draw Smooth Player Sprite
          const px = Math.round(playerPosRef.current.x * TILE_SIZE);
          const py = Math.round(playerPosRef.current.y * TILE_SIZE);

          let playerMatrix = PLAYER_SPRITES.down_idle;
          if (playerDirection === 'down') {
            playerMatrix = walkFrame === 1 ? PLAYER_SPRITES.down_walk1 : PLAYER_SPRITES.down_idle;
          } else if (playerDirection === 'up') {
            playerMatrix = PLAYER_SPRITES.up_idle;
          } else if (playerDirection === 'left' || playerDirection === 'right') {
            playerMatrix = PLAYER_SPRITES.side_idle;
          }

          // Player shadow underneath
          ctx.fillStyle = 'rgba(7, 8, 20, 0.45)';
          ctx.beginPath();
          ctx.ellipse(px + 16, py + 30, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          if (playerDirection === 'left') {
            ctx.translate(px + TILE_SIZE, py);
            ctx.scale(-1, 1);
            drawPixelMatrix(ctx, playerMatrix, PIXEL_PALETTE, 0, 0, 2);
          } else {
            drawPixelMatrix(ctx, playerMatrix, PIXEL_PALETTE, px, py, 2);
          }
          ctx.restore();

          // Swift Boots Active Aura (Golden Gale effect)
          if (hasActiveSpeedBoost) {
            ctx.save();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px + 16, py + 18, 18, 0, Math.PI * 2);
            ctx.stroke();
            // Tiny sparkle trails
            ctx.fillStyle = '#fde047';
            const timeVal = Date.now() / 200;
            ctx.fillRect(px + 6 + Math.sin(timeVal) * 8, py + 26, 3, 3);
            ctx.fillRect(px + 22 + Math.cos(timeVal) * 8, py + 28, 3, 3);
            ctx.restore();
          }

          // Ambient Dungeon Vignette
          const gradient = ctx.createRadialGradient(
            px + 16,
            py + 16,
            30,
            px + 16,
            py + 16,
            260
          );
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(0.75, 'rgba(7, 8, 20, 0.35)');
          gradient.addColorStop(1, 'rgba(7, 8, 20, 0.85)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    isPaused,
    isCombatActive,
    hasActiveSpeedBoost,
    playerDirection,
    walkFrame,
    checkWallCollision,
  ]);

  // Touch controls helpers for mobile D-pad
  const handleTouchDirection = (key: string, isDown: boolean) => {
    keysRef.current[key] = isDown;
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* 2D Canvas Container with pixelated rendering */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={MAP_COLS * TILE_SIZE}
          height={MAP_ROWS * TILE_SIZE}
          className="block w-full max-w-[680px] h-auto cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Dynamic In-World Interaction Action Bar */}
        {nearbyAction && !isPaused && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-purple-950/95 border border-purple-400 text-purple-200 text-xs font-bold shadow-xl animate-bounce flex items-center gap-2">
            <Hand className="w-4 h-4 text-amber-400" />
            <span>{nearbyAction.text}</span>
            <button
              onClick={() => nearbyAction.action()}
              className="ml-2 px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-extrabold uppercase shadow"
            >
              Action [E]
            </button>
          </div>
        )}

        {/* Threat Warning if monsters are chasing */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>MONSTERS HUNTING YOU!</span>
        </div>

        {/* In-Game HUD overlay */}
        <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-white/10 pointer-events-none">
          <span>Floor {floor}</span>
          <span aria-hidden="true">·</span>
          <span>Room {roomNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{roomType === 'boss' ? 'Sovereign Lair' : roomNumber === 3 ? 'Mini-Boss Pit' : 'Chamber Exploration'}</span>
        </div>

        {/* Pause Button */}
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs flex items-center gap-1"
          title="Pause [ESC]"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Pause Menu Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
            <h3 className="text-2xl font-bold text-white font-cinzel">Exploration Paused</h3>
            <p className="text-xs text-slate-300 max-w-xs">
              WASD or Arrow Keys for smooth movement. Monsters actively hunt you! Approach doors to solve their cipher questions. Defeat Bosses to break exit wards!
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {/* Virtual Touch Controller for Mobile */}
      <div className="w-full max-w-[680px] flex items-center justify-between pt-3 px-2 text-xs">
        <div className="grid grid-cols-3 gap-1 w-32 select-none">
          <div />
          <button
            onPointerDown={() => handleTouchDirection('w', true)}
            onPointerUp={() => handleTouchDirection('w', false)}
            className="p-3 bg-slate-800/90 active:bg-purple-600 rounded-xl text-white flex items-center justify-center border border-white/10 shadow"
            aria-label="Move Up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />

          <button
            onPointerDown={() => handleTouchDirection('a', true)}
            onPointerUp={() => handleTouchDirection('a', false)}
            className="p-3 bg-slate-800/90 active:bg-purple-600 rounded-xl text-white flex items-center justify-center border border-white/10 shadow"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-3 bg-slate-900/60 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">
            PAD
          </div>
          <button
            onPointerDown={() => handleTouchDirection('d', true)}
            onPointerUp={() => handleTouchDirection('d', false)}
            className="p-3 bg-slate-800/90 active:bg-purple-600 rounded-xl text-white flex items-center justify-center border border-white/10 shadow"
            aria-label="Move Right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <div />
          <button
            onPointerDown={() => handleTouchDirection('s', true)}
            onPointerUp={() => handleTouchDirection('s', false)}
            className="p-3 bg-slate-800/90 active:bg-purple-600 rounded-xl text-white flex items-center justify-center border border-white/10 shadow"
            aria-label="Move Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <div />
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            disabled={!nearbyAction}
            onClick={() => nearbyAction && nearbyAction.action()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Hand className="w-4 h-4 text-amber-300" />
            <span>INTERACT [E]</span>
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Monsters relentlessly hunt you · Solve door questions or engage in battle
          </span>
        </div>
      </div>
    </div>
  );
};
