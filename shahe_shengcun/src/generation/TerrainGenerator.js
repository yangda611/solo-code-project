import { PerlinNoise } from './PerlinNoise.js';
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  WORLD_SEED,
  BLOCK_AIR,
  BLOCK_STONE,
  BLOCK_DIRT,
  BLOCK_GRASS,
  BLOCK_WATER,
  BLOCK_SAND,
  BLOCK_BEDROCK,
  BLOCK_COAL_ORE,
  BLOCK_IRON_ORE,
  BLOCK_GOLD_ORE,
  BLOCK_DIAMOND_ORE,
  BLOCK_SNOW_BLOCK,
  BLOCK_GRAVEL,
  BLOCK_CLAY,
  BLOCK_WOOD,
  BLOCK_LEAVES,
  BIOME_OCEAN,
  BIOME_PLAINS,
  BIOME_DESERT,
  BIOME_FOREST,
  BIOME_TAIGA,
  BIOME_SWAMP,
  BIOME_MOUNTAINS,
  BIOME_TUNDRA,
  BIOME_JUNGLE,
  BIOME_BEACH,
  BIOME_PARAMS,
  WATER_LEVEL,
} from '../utils/Constants.js';
import { smoothstep, hash } from '../utils/Utils.js';

export class TerrainGenerator {
  constructor(seed = WORLD_SEED) {
    this.seed = seed;
    this.baseNoise = new PerlinNoise(seed);
    this.mountainNoise = new PerlinNoise(seed + 1000);
    this.humidityNoise = new PerlinNoise(seed + 2000);
    this.temperatureNoise = new PerlinNoise(seed + 3000);
    this.caveNoise = new PerlinNoise(seed + 4000);
    this.oreNoise = new PerlinNoise(seed + 5000);
  }
  
  getBiome(worldX, worldZ) {
    const scale = 0.0015;
    const temp = (this.temperatureNoise.fbm(worldX * scale, worldZ * scale, 4) + 1) * 0.5;
    const humidity = (this.humidityNoise.fbm(worldX * scale, worldZ * scale, 4) + 1) * 0.5;
    
    const seaLevel = WATER_LEVEL;
    const baseHeight = this.getBaseHeight(worldX, worldZ);
    
    if (baseHeight < seaLevel - 4) {
      return BIOME_OCEAN;
    }
    
    if (baseHeight < seaLevel + 1 && baseHeight >= seaLevel - 2) {
      return BIOME_BEACH;
    }
    
    if (baseHeight > seaLevel + 20) {
      if (temp < 0.4) {
        return BIOME_TUNDRA;
      }
      return BIOME_MOUNTAINS;
    }
    
    if (temp > 0.8) {
      if (humidity > 0.85) {
        return BIOME_JUNGLE;
      }
      if (humidity < 0.3) {
        return BIOME_DESERT;
      }
      return BIOME_PLAINS;
    }
    
    if (temp < 0.35) {
      return BIOME_TAIGA;
    }
    
    if (humidity > 0.75 && baseHeight < seaLevel + 5) {
      return BIOME_SWAMP;
    }
    
    if (humidity > 0.6) {
      return BIOME_FOREST;
    }
    
    return BIOME_PLAINS;
  }
  
  getBaseHeight(worldX, worldZ) {
    const baseScale = 0.003;
    const detailScale = 0.015;
    
    let height = 64;
    
    const baseNoise = this.baseNoise.fbm(worldX * baseScale, worldZ * baseScale, 6);
    height += baseNoise * 30;
    
    const detailNoise = this.baseNoise.fbm(worldX * detailScale, worldZ * detailScale, 4);
    height += detailNoise * 5;
    
    const mountainNoise = this.mountainNoise.ridgedNoise(worldX * 0.002, worldZ * 0.002, 6);
    const mountainThreshold = 0.3;
    const mountainFactor = smoothstep(mountainThreshold, 0.8, mountainNoise);
    height += mountainFactor * 40;
    
    return Math.floor(height);
  }
  
  generateChunk(chunkX, chunkZ) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const lightMap = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const decorations = [];
    
    const worldBaseX = chunkX * CHUNK_SIZE;
    const worldBaseZ = chunkZ * CHUNK_SIZE;
    
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = worldBaseX + x;
        const worldZ = worldBaseZ + z;
        
        const biome = this.getBiome(worldX, worldZ);
        const biomeParams = BIOME_PARAMS[biome];
        const surfaceHeight = this.getBaseHeight(worldX, worldZ);
        
        let surfaceBlock = biomeParams.surfaceBlock;
        let fillerBlock = biomeParams.fillerBlock;
        
        if (biome === BIOME_SWAMP) {
          if (surfaceHeight <= WATER_LEVEL + 1) {
            surfaceBlock = BLOCK_GRASS;
          }
        }
        
        if (biome === BIOME_BEACH || biome === BIOME_OCEAN) {
          if (surfaceHeight > WATER_LEVEL) {
            surfaceBlock = BLOCK_SAND;
            fillerBlock = BLOCK_SAND;
          }
        }
        
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const index = this.getBlockIndex(x, y, z);
          
          if (y === 0) {
            blocks[index] = BLOCK_BEDROCK;
            continue;
          }
          
          if (y <= 3) {
            const bedrockChance = hash(worldX, worldZ + y * 1000, this.seed) / 0xFFFFFFFF;
            if (bedrockChance < 0.7) {
              blocks[index] = BLOCK_BEDROCK;
              continue;
            }
          }
          
          if (y > surfaceHeight) {
            if (y <= WATER_LEVEL) {
              blocks[index] = BLOCK_WATER;
            } else {
              blocks[index] = BLOCK_AIR;
            }
            continue;
          }
          
          const isCave = this.isCave(worldX, y, worldZ);
          if (isCave && y < surfaceHeight - 5) {
            blocks[index] = BLOCK_AIR;
            continue;
          }
          
          if (y === surfaceHeight) {
            if (biome === BIOME_TUNDRA || (biome === BIOME_MOUNTAINS && y > 90)) {
              blocks[index] = BLOCK_SNOW_BLOCK;
            } else if (y < WATER_LEVEL) {
              blocks[index] = BLOCK_SAND;
            } else {
              blocks[index] = surfaceBlock;
            }
          } else if (y > surfaceHeight - 4 && y < surfaceHeight) {
            if (y < WATER_LEVEL) {
              blocks[index] = BLOCK_SAND;
            } else {
              blocks[index] = fillerBlock;
            }
          } else {
            blocks[index] = BLOCK_STONE;
          }
          
          if (blocks[index] === BLOCK_STONE) {
            const ore = this.getOre(worldX, y, worldZ);
            if (ore !== BLOCK_STONE) {
              blocks[index] = ore;
            }
          }
          
          if (biome === BIOME_SWAMP && y === surfaceHeight - 1 && blocks[index] === BLOCK_DIRT) {
            const clayChance = hash(worldX + worldZ * 1000, y, this.seed + 6000) / 0xFFFFFFFF;
            if (clayChance < 0.15) {
              blocks[index] = BLOCK_CLAY;
            }
          }
          
          if (blocks[index] === BLOCK_DIRT && y < surfaceHeight - 4) {
            const gravelChance = hash(worldX + y * 1000, worldZ, this.seed + 7000) / 0xFFFFFFFF;
            if (gravelChance < 0.02) {
              blocks[index] = BLOCK_GRAVEL;
            }
          }
        }
        
        if (surfaceHeight > WATER_LEVEL) {
          const topY = surfaceHeight + 1;
          const treeChance = this.getTreeChance(biome, worldX, worldZ);
          
          if (treeChance > 0) {
            const rand = hash(worldX, worldZ, this.seed + 8000) / 0xFFFFFFFF;
            if (rand < treeChance) {
              const treeHeight = this.getTreeHeight(biome, worldX, worldZ);
              decorations.push({
                type: 'tree',
                x,
                y: surfaceHeight + 1,
                z,
                height: treeHeight,
                biome,
              });
            }
          }
        }
      }
    }
    
    return {
      blocks,
      lightMap,
      decorations,
    };
  }
  
  getTreeChance(biome, worldX, worldZ) {
    const rand = hash(worldX, worldZ, this.seed + 9000) / 0xFFFFFFFF;
    
    switch (biome) {
      case BIOME_FOREST:
        return 0.08;
      case BIOME_TAIGA:
        return 0.06;
      case BIOME_JUNGLE:
        return 0.12;
      case BIOME_PLAINS:
        return 0.01;
      case BIOME_SWAMP:
        return 0.03;
      case BIOME_DESERT:
        return 0;
      case BIOME_TUNDRA:
        return 0;
      case BIOME_MOUNTAINS:
        return 0.02;
      default:
        return 0;
    }
  }
  
  getTreeHeight(biome, worldX, worldZ) {
    const rand = hash(worldX + 100, worldZ, this.seed + 10000) / 0xFFFFFFFF;
    
    switch (biome) {
      case BIOME_JUNGLE:
        return Math.floor(6 + rand * 10);
      case BIOME_TAIGA:
        return Math.floor(5 + rand * 6);
      case BIOME_FOREST:
        return Math.floor(4 + rand * 4);
      default:
        return Math.floor(4 + rand * 3);
    }
  }
  
  isCave(worldX, y, worldZ) {
    if (y < 10 || y > 60) return false;
    
    const scale = 0.05;
    const noise1 = this.caveNoise.noise3D(worldX * scale, y * scale, worldZ * scale);
    const noise2 = this.caveNoise.noise3D(worldX * scale * 2 + 100, y * scale * 2, worldZ * scale * 2 + 100);
    
    const combined = noise1 * 0.6 + noise2 * 0.4;
    
    const densityFactor = Math.max(0, (y - 10) / 50);
    
    return combined > 0.4 - densityFactor * 0.2;
  }
  
  getOre(worldX, y, worldZ) {
    const oreTypes = [
      { block: BLOCK_COAL_ORE, minY: 1, maxY: 128, size: 16, chance: 0.008 },
      { block: BLOCK_IRON_ORE, minY: 1, maxY: 64, size: 8, chance: 0.005 },
      { block: BLOCK_GOLD_ORE, minY: 1, maxY: 32, size: 8, chance: 0.002 },
      { block: BLOCK_DIAMOND_ORE, minY: 1, maxY: 16, size: 8, chance: 0.001 },
    ];
    
    for (const ore of oreTypes) {
      if (y < ore.minY || y > ore.maxY) continue;
      
      const rand = hash(
        Math.floor(worldX / ore.size) * ore.size,
        Math.floor(y / ore.size) * ore.size,
        Math.floor(worldZ / ore.size) * ore.size + this.seed + 11000
      ) / 0xFFFFFFFF;
      
      if (rand < ore.chance) {
        const localRand = hash(worldX + y * 1000, worldZ, this.seed + 12000) / 0xFFFFFFFF;
        if (localRand < 0.3) {
          return ore.block;
        }
      }
    }
    
    return BLOCK_STONE;
  }
  
  getBlockIndex(x, y, z) {
    return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x;
  }
}
