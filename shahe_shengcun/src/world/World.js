import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { TerrainGenerator } from '../generation/TerrainGenerator.js';
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  BLOCK_AIR,
  BLOCK_STONE,
  BLOCK_DIRT,
  BLOCK_GRASS,
  BLOCK_SAND,
  BLOCK_WATER,
  BLOCK_BEDROCK,
  BLOCK_SNOW_BLOCK,
  BLOCK_TYPES,
  BLOCK_WOOD,
  BLOCK_LEAVES,
  LOAD_DISTANCE,
  UNLOAD_DISTANCE,
  RENDER_DISTANCE,
  WATER_LEVEL,
  BIOME_PARAMS,
  BIOME_OCEAN,
  BIOME_SWAMP,
  BIOME_BEACH,
  BIOME_TUNDRA,
  BIOME_MOUNTAINS,
} from '../utils/Constants.js';
import { PriorityQueue, hash } from '../utils/Utils.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.terrainGenerator = new TerrainGenerator();
    
    this.loadQueue = new PriorityQueue();
    this.unloadQueue = [];
    this.decorationQueue = [];
    
    this.chunksToRebuild = new Set();
    this.maxLoadsPerFrame = 2;
    this.maxRebuildsPerFrame = 2;
    
    this.playerChunkX = Infinity;
    this.playerChunkZ = Infinity;
  }
  
  getChunk(chunkX, chunkZ) {
    const key = `${chunkX},${chunkZ}`;
    return this.chunks.get(key);
  }
  
  getBlock(worldX, worldY, worldZ) {
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
      return BLOCK_TYPES[BLOCK_AIR];
    }
    
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    const chunk = this.getChunk(chunkX, chunkZ);
    
    if (!chunk || !chunk.isGenerated) {
      return this.getPredictedBlock(worldX, worldY, worldZ);
    }
    
    const localX = worldX - chunkX * CHUNK_SIZE;
    const localZ = worldZ - chunkZ * CHUNK_SIZE;
    
    return chunk.getBlock(localX, worldY, localZ);
  }
  
  getPredictedBlock(worldX, worldY, worldZ) {
    const biome = this.terrainGenerator.getBiome(worldX, worldZ);
    const biomeParams = BIOME_PARAMS[biome];
    const surfaceHeight = this.terrainGenerator.getBaseHeight(worldX, worldZ);
    
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
    
    if (worldY === 0) {
      return BLOCK_TYPES[BLOCK_BEDROCK];
    }
    
    if (worldY <= 3) {
      const bedrockChance = hash(worldX, worldZ + worldY * 1000, this.terrainGenerator.seed) / 0xFFFFFFFF;
      if (bedrockChance < 0.7) {
        return BLOCK_TYPES[BLOCK_BEDROCK];
      }
    }
    
    if (worldY > surfaceHeight && worldY <= WATER_LEVEL) {
      return BLOCK_TYPES[BLOCK_WATER];
    }
    
    if (worldY > surfaceHeight) {
      return BLOCK_TYPES[BLOCK_AIR];
    }
    
    if (worldY === surfaceHeight) {
      if (biome === BIOME_TUNDRA || (biome === BIOME_MOUNTAINS && worldY > 90)) {
        return BLOCK_TYPES[BLOCK_SNOW_BLOCK];
      } else if (worldY < WATER_LEVEL) {
        return BLOCK_TYPES[BLOCK_SAND];
      } else {
        return BLOCK_TYPES[surfaceBlock];
      }
    } else if (worldY > surfaceHeight - 4 && worldY < surfaceHeight) {
      if (worldY < WATER_LEVEL) {
        return BLOCK_TYPES[BLOCK_SAND];
      } else {
        return BLOCK_TYPES[fillerBlock];
      }
    }
    
    return BLOCK_TYPES[BLOCK_STONE];
  }
  
  setBlock(worldX, worldY, worldZ, blockId) {
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
      return false;
    }
    
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    const chunk = this.getChunk(chunkX, chunkZ);
    
    if (!chunk || !chunk.isGenerated) {
      return false;
    }
    
    const localX = worldX - chunkX * CHUNK_SIZE;
    const localZ = worldZ - chunkZ * CHUNK_SIZE;
    
    const success = chunk.setBlock(localX, worldY, localZ, blockId);
    
    if (success) {
      this.chunksToRebuild.add(chunk);
    }
    
    return success;
  }
  
  update(playerX, playerZ) {
    const newChunkX = Math.floor(playerX / CHUNK_SIZE);
    const newChunkZ = Math.floor(playerZ / CHUNK_SIZE);
    
    if (newChunkX !== this.playerChunkX || newChunkZ !== this.playerChunkZ) {
      this.playerChunkX = newChunkX;
      this.playerChunkZ = newChunkZ;
      this.updateChunkQueues();
    }
    
    this.processLoadQueue();
    this.processRebuildQueue();
    this.processDecorationQueue();
    this.processUnloadQueue();
  }
  
  updateChunkQueues() {
    const centerX = this.playerChunkX;
    const centerZ = this.playerChunkZ;
    
    for (let dx = -LOAD_DISTANCE; dx <= LOAD_DISTANCE; dx++) {
      for (let dz = -LOAD_DISTANCE; dz <= LOAD_DISTANCE; dz++) {
        const chunkX = centerX + dx;
        const chunkZ = centerZ + dz;
        const distance = Math.max(Math.abs(dx), Math.abs(dz));
        
        if (distance <= LOAD_DISTANCE) {
          const key = `${chunkX},${chunkZ}`;
          
          if (!this.chunks.has(key)) {
            const priority = distance;
            this.loadQueue.enqueue({ x: chunkX, z: chunkZ }, priority);
          }
        }
      }
    }
  }
  
  processLoadQueue() {
    let loadedCount = 0;
    
    while (!this.loadQueue.isEmpty() && loadedCount < this.maxLoadsPerFrame) {
      const chunkData = this.loadQueue.dequeue();
      const { x, z } = chunkData;
      const key = `${x},${z}`;
      
      if (this.chunks.has(key)) continue;
      
      const distanceToPlayer = Math.max(
        Math.abs(x - this.playerChunkX),
        Math.abs(z - this.playerChunkZ)
      );
      
      if (distanceToPlayer > UNLOAD_DISTANCE) continue;
      
      const chunk = new Chunk(x, z, this);
      this.chunks.set(key, chunk);
      
      this.generateChunkAsync(chunk);
      loadedCount++;
    }
  }
  
  generateChunkSync(chunk) {
    const terrainData = this.terrainGenerator.generateChunk(chunk.x, chunk.z);
    chunk.blocks = terrainData.blocks;
    chunk.lightMap = terrainData.lightMap;
    chunk.decorations = terrainData.decorations;
    chunk.isGenerated = true;
    
    this.decorationQueue.push(chunk);
    this.chunksToRebuild.add(chunk);
  }
  
  async generateChunkAsync(chunk) {
    const terrainData = this.terrainGenerator.generateChunk(chunk.x, chunk.z);
    chunk.blocks = terrainData.blocks;
    chunk.lightMap = terrainData.lightMap;
    chunk.decorations = terrainData.decorations;
    chunk.isGenerated = true;
    
    this.decorationQueue.push(chunk);
    this.chunksToRebuild.add(chunk);
  }
  
  processDecorationQueue() {
    if (this.decorationQueue.length === 0) return;
    
    const chunk = this.decorationQueue.shift();
    if (!chunk || chunk.isDecorated) return;
    
    this.applyDecorations(chunk);
    chunk.isDecorated = true;
  }
  
  applyDecorations(chunk) {
    for (const decoration of chunk.decorations) {
      if (decoration.type === 'tree') {
        this.generateTree(chunk, decoration);
      }
    }
  }
  
  generateTree(chunk, decoration) {
    const { x, y, z, height, biome } = decoration;
    const worldBaseX = chunk.worldOffsetX;
    const worldBaseZ = chunk.worldOffsetZ;
    
    for (let dy = 0; dy < height; dy++) {
      const worldX = worldBaseX + x;
      const worldY = y + dy;
      const worldZ = worldBaseZ + z;
      
      const currentBlock = this.getBlock(worldX, worldY, worldZ);
      if (currentBlock.id !== BLOCK_AIR && currentBlock.id !== BLOCK_LEAVES) {
        continue;
      }
      
      this.setBlock(worldX, worldY, worldZ, BLOCK_WOOD);
    }
    
    const leafStartY = y + height - 3;
    const leafRadius = biome === 8 ? 2 : 1;
    
    for (let ly = 0; ly < 4; ly++) {
      const currentY = leafStartY + ly;
      const currentRadius = leafRadius + (ly < 2 ? 1 : 0);
      
      for (let lx = -currentRadius; lx <= currentRadius; lx++) {
        for (let lz = -currentRadius; lz <= currentRadius; lz++) {
          if (lx === 0 && lz === 0 && ly < 3) continue;
          
          const dist = Math.abs(lx) + Math.abs(lz);
          if (dist > currentRadius + 1) continue;
          
          const worldX = worldBaseX + x + lx;
          const worldZ = worldBaseZ + z + lz;
          
          const currentBlock = this.getBlock(worldX, currentY, worldZ);
          if (currentBlock.id === BLOCK_AIR) {
            this.setBlock(worldX, currentY, worldZ, BLOCK_LEAVES);
          }
        }
      }
    }
  }
  
  processRebuildQueue() {
    let rebuildCount = 0;
    
    for (const chunk of this.chunksToRebuild) {
      if (rebuildCount >= this.maxRebuildsPerFrame) break;
      
      if (chunk && chunk.isGenerated) {
        chunk.buildMesh();
        this.chunksToRebuild.delete(chunk);
        rebuildCount++;
      }
    }
  }
  
  processAllRebuilds() {
    for (const chunk of this.chunksToRebuild) {
      if (chunk && chunk.isGenerated) {
        chunk.buildMesh();
      }
    }
    this.chunksToRebuild.clear();
  }
  
  processUnloadQueue() {
    const chunksToUnload = [];
    
    for (const [key, chunk] of this.chunks) {
      const distance = Math.max(
        Math.abs(chunk.x - this.playerChunkX),
        Math.abs(chunk.z - this.playerChunkZ)
      );
      
      if (distance > UNLOAD_DISTANCE) {
        chunksToUnload.push(key);
      }
    }
    
    for (const key of chunksToUnload) {
      const chunk = this.chunks.get(key);
      if (chunk) {
        chunk.dispose();
        this.chunks.delete(key);
        this.chunksToRebuild.delete(chunk);
      }
    }
  }
  
  nextFrame() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
  
  getLoadedChunksCount() {
    return this.chunks.size;
  }
  
  getBiomeAt(worldX, worldZ) {
    return this.terrainGenerator.getBiome(worldX, worldZ);
  }
  
  getSurfaceHeight(worldX, worldZ) {
    return this.terrainGenerator.getBaseHeight(worldX, worldZ);
  }
  
  preloadChunksAround(centerX, centerZ, distance = 2) {
    const chunkX = Math.floor(centerX / CHUNK_SIZE);
    const chunkZ = Math.floor(centerZ / CHUNK_SIZE);
    
    for (let dx = -distance; dx <= distance; dx++) {
      for (let dz = -distance; dz <= distance; dz++) {
        const x = chunkX + dx;
        const z = chunkZ + dz;
        const key = `${x},${z}`;
        
        if (!this.chunks.has(key)) {
          const chunk = new Chunk(x, z, this);
          this.chunks.set(key, chunk);
          this.generateChunkSync(chunk);
        }
      }
    }
    
    this.playerChunkX = chunkX;
    this.playerChunkZ = chunkZ;
  }
}
