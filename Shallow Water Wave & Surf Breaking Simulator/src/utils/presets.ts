import { PresetScene, GRID_SIZE } from '../types';

function createFlatTerrain(depth: number): number[][] {
  const terrain: number[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    terrain[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      terrain[y][x] = depth;
    }
  }
  return terrain;
}

function createShoreTerrain(): number[][] {
  const terrain: number[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    terrain[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const nx = x / GRID_SIZE;
      const distFromShore = nx;
      const baseDepth = distFromShore * 15;
      const ripple = Math.sin(nx * 20) * 0.5 + Math.sin(nx * 50) * 0.2;
      terrain[y][x] = Math.max(0.5, baseDepth + ripple);
    }
  }
  return terrain;
}

function createBreakwaterTerrain(): number[][] {
  const terrain: number[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    terrain[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const nx = x / GRID_SIZE;
      const ny = y / GRID_SIZE;
      
      let depth = nx * 10;
      
      const breakwaterX = 0.6;
      const breakwaterWidth = 0.05;
      const breakwaterY1 = 0.3;
      const breakwaterY2 = 0.7;
      
      if (Math.abs(nx - breakwaterX) < breakwaterWidth && ny > breakwaterY1 && ny < breakwaterY2) {
        depth = -5;
      }
      
      terrain[y][x] = Math.max(0.5, depth);
    }
  }
  return terrain;
}

function createBayTerrain(): number[][] {
  const terrain: number[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    terrain[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const nx = x / GRID_SIZE;
      const ny = y / GRID_SIZE - 0.5;
      
      const bayWidth = 0.2 + Math.abs(ny) * 0.3;
      const bayEntrance = 0.7;
      
      if (nx > bayEntrance && Math.abs(ny) > bayWidth) {
        terrain[y][x] = -2;
      } else {
        const depth = (1 - nx) * 8;
        terrain[y][x] = Math.max(1, depth);
      }
    }
  }
  return terrain;
}

export const PRESET_SCENES: PresetScene[] = [
  {
    name: '深水涌浪预设',
    description: '平缓深水区域的规则波浪传播，观察色散效应',
    params: {
      period: 10,
      height: 1.2,
      direction: 0,
      breakingThreshold: 0.8,
      dispersionStrength: 1.0
    },
    terrain: createFlatTerrain(12)
  },
  {
    name: '近岸卷破预设',
    description: '近岸斜坡地形，波浪浅化破碎，观察数值激波伪影',
    params: {
      period: 6,
      height: 2.5,
      direction: 0,
      breakingThreshold: 0.4,
      dispersionStrength: 0.6
    },
    terrain: createShoreTerrain()
  },
  {
    name: '防波堤绕射预设',
    description: '单突堤地形，观察波浪绕射与边界反射驻波',
    params: {
      period: 8,
      height: 1.8,
      direction: 0.3,
      breakingThreshold: 0.6,
      dispersionStrength: 0.8
    },
    terrain: createBreakwaterTerrain()
  },
  {
    name: '狭湾共振预设',
    description: '喇叭形狭湾，观察共振现象与虚假提前破碎',
    params: {
      period: 12,
      height: 1.0,
      direction: 0,
      breakingThreshold: 0.3,
      dispersionStrength: 0.5
    },
    terrain: createBayTerrain()
  }
];

export function createDefaultTerrain(): number[][] {
  return createShoreTerrain();
}
