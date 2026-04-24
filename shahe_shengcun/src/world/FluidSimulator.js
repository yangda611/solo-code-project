import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_WATER,
  BLOCK_LAVA,
  BLOCK_TYPES,
  FLUID_UPDATE_RATE,
  FLUID_SPREAD_DELAY,
} from '../utils/Constants.js';
import { getHorizontalDirections } from '../utils/Utils.js';

export class FluidSimulator {
  constructor(world) {
    this.world = world;
    this.updateQueue = new Map();
    this.updateTimer = 0;
    this.updateInterval = 1.0 / FLUID_UPDATE_RATE;
    
    this.maxUpdatesPerFrame = 50;
  }
  
  onBlockChanged(worldX, worldY, worldZ) {
    this.addToQueue(worldX, worldY, worldZ);
    
    this.addToQueue(worldX + 1, worldY, worldZ);
    this.addToQueue(worldX - 1, worldY, worldZ);
    this.addToQueue(worldX, worldY + 1, worldZ);
    this.addToQueue(worldX, worldY - 1, worldZ);
    this.addToQueue(worldX, worldY, worldZ + 1);
    this.addToQueue(worldX, worldY, worldZ - 1);
  }
  
  addToQueue(worldX, worldY, worldZ) {
    const key = `${worldX},${worldY},${worldZ}`;
    if (!this.updateQueue.has(key)) {
      this.updateQueue.set(key, {
        x: worldX,
        y: worldY,
        z: worldZ,
        time: 0,
      });
    }
  }
  
  update(deltaTime) {
    this.updateTimer += deltaTime;
    
    if (this.updateTimer >= this.updateInterval) {
      this.updateTimer = 0;
      this.processUpdates();
    }
  }
  
  processUpdates() {
    let updatesProcessed = 0;
    const keysToProcess = [];
    
    for (const [key, data] of this.updateQueue) {
      if (updatesProcessed >= this.maxUpdatesPerFrame) break;
      
      const block = this.world.getBlock(data.x, data.y, data.z);
      
      if (!block.liquid && block.id !== BLOCK_AIR) {
        const belowBlock = this.world.getBlock(data.x, data.y - 1, data.z);
        if (belowBlock.liquid) {
          keysToProcess.push(key);
        }
        continue;
      }
      
      keysToProcess.push(key);
    }
    
    for (const key of keysToProcess) {
      const data = this.updateQueue.get(key);
      if (data) {
        this.processFluid(data.x, data.y, data.z);
      }
      this.updateQueue.delete(key);
      updatesProcessed++;
    }
  }
  
  processFluid(worldX, worldY, worldZ) {
    const block = this.world.getBlock(worldX, worldY, worldZ);
    
    if (block.liquid) {
      this.tryFlowDown(worldX, worldY, worldZ, block.id);
      this.trySpread(worldX, worldY, worldZ, block.id);
    } else if (block.id === BLOCK_AIR) {
      const aboveBlock = this.world.getBlock(worldX, worldY + 1, worldZ);
      if (aboveBlock.liquid) {
        this.tryFlowDown(worldX, worldY, worldZ, aboveBlock.id);
      }
    }
  }
  
  tryFlowDown(worldX, worldY, worldZ, fluidId) {
    const belowBlock = this.world.getBlock(worldX, worldY - 1, worldZ);
    
    if (belowBlock.id === BLOCK_AIR) {
      this.world.setBlock(worldX, worldY - 1, worldZ, fluidId);
      this.addToQueue(worldX, worldY - 1, worldZ);
      return true;
    }
    
    if (belowBlock.liquid && belowBlock.id !== fluidId) {
      if (fluidId === BLOCK_LAVA && belowBlock.id === BLOCK_WATER) {
        this.world.setBlock(worldX, worldY - 1, worldZ, 15);
        this.addToQueue(worldX, worldY - 1, worldZ);
        return true;
      } else if (fluidId === BLOCK_WATER && belowBlock.id === BLOCK_LAVA) {
        this.world.setBlock(worldX, worldY - 1, worldZ, 15);
        this.addToQueue(worldX, worldY - 1, worldZ);
        return true;
      }
    }
    
    return false;
  }
  
  trySpread(worldX, worldY, worldZ, fluidId) {
    const directions = getHorizontalDirections();
    const possibleTargets = [];
    
    for (const dir of directions) {
      const targetX = worldX + dir.x;
      const targetZ = worldZ + dir.z;
      
      const targetBlock = this.world.getBlock(targetX, worldY, targetZ);
      
      if (targetBlock.id === BLOCK_AIR) {
        const belowTarget = this.world.getBlock(targetX, worldY - 1, targetZ);
        
        if (belowTarget.solid || belowTarget.liquid) {
          possibleTargets.push({ x: targetX, y: worldY, z: targetZ });
        } else {
          possibleTargets.push({ x: targetX, y: worldY - 1, z: targetZ, priority: 1 });
        }
      } else if (targetBlock.liquid && targetBlock.id !== fluidId) {
        if (fluidId === BLOCK_LAVA && targetBlock.id === BLOCK_WATER) {
          this.world.setBlock(targetX, worldY, targetZ, 15);
          this.addToQueue(targetX, worldY, targetZ);
        } else if (fluidId === BLOCK_WATER && targetBlock.id === BLOCK_LAVA) {
          this.world.setBlock(targetX, worldY, targetZ, 15);
          this.addToQueue(targetX, worldY, targetZ);
        }
      }
    }
    
    if (possibleTargets.length > 0) {
      const maxSpread = fluidId === BLOCK_LAVA ? 2 : 4;
      const currentLevel = this.getFluidLevel(worldX, worldY, worldZ);
      
      if (currentLevel > 0 && currentLevel <= maxSpread) {
        for (const target of possibleTargets) {
          if (Math.random() < 0.5) {
            this.world.setBlock(target.x, target.y, target.z, fluidId);
            this.addToQueue(target.x, target.y, target.z);
          }
        }
      }
    }
  }
  
  getFluidLevel(worldX, worldY, worldZ) {
    let level = 0;
    let checkY = worldY + 1;
    
    while (checkY < 256) {
      const block = this.world.getBlock(worldX, checkY, worldZ);
      if (block.liquid) {
        level++;
        checkY++;
      } else {
        break;
      }
    }
    
    return level;
  }
  
  canReplaceBlock(blockId) {
    if (blockId === BLOCK_AIR) return true;
    
    const block = BLOCK_TYPES[blockId];
    if (!block) return false;
    
    return !block.solid && !block.liquid;
  }
}
