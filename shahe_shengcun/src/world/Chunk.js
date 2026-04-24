import * as THREE from 'three';
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  BLOCK_AIR,
  BLOCK_TYPES,
  BLOCK_WATER,
  BLOCK_LAVA,
  BLOCK_GRASS,
} from '../utils/Constants.js';

export class Chunk {
  constructor(x, z, world) {
    this.x = x;
    this.z = z;
    this.world = world;
    
    this.blocks = null;
    this.lightMap = null;
    this.decorations = [];
    
    this.mesh = null;
    this.waterMesh = null;
    this.isDirty = true;
    this.isGenerated = false;
    this.isDecorated = false;
    
    this.worldOffsetX = x * CHUNK_SIZE;
    this.worldOffsetZ = z * CHUNK_SIZE;
  }
  
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      const worldX = this.worldOffsetX + x;
      const worldZ = this.worldOffsetZ + z;
      return this.world.getBlock(worldX, y, worldZ);
    }
    
    if (!this.blocks) return BLOCK_TYPES[BLOCK_AIR];
    
    const index = this.getBlockIndex(x, y, z);
    const blockId = this.blocks[index];
    return BLOCK_TYPES[blockId] || BLOCK_TYPES[BLOCK_AIR];
  }
  
  setBlock(x, y, z, blockId) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return false;
    }
    
    if (!this.blocks) return false;
    
    const index = this.getBlockIndex(x, y, z);
    const oldBlockId = this.blocks[index];
    
    if (oldBlockId === blockId) return false;
    
    this.blocks[index] = blockId;
    this.isDirty = true;
    
    if (x === 0) {
      const neighbor = this.world.getChunk(this.x - 1, this.z);
      if (neighbor) neighbor.isDirty = true;
    }
    if (x === CHUNK_SIZE - 1) {
      const neighbor = this.world.getChunk(this.x + 1, this.z);
      if (neighbor) neighbor.isDirty = true;
    }
    if (z === 0) {
      const neighbor = this.world.getChunk(this.x, this.z - 1);
      if (neighbor) neighbor.isDirty = true;
    }
    if (z === CHUNK_SIZE - 1) {
      const neighbor = this.world.getChunk(this.x, this.z + 1);
      if (neighbor) neighbor.isDirty = true;
    }
    
    return true;
  }
  
  getBlockIndex(x, y, z) {
    return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x;
  }
  
  buildMesh() {
    if (!this.isGenerated) return;
    
    if (this.mesh) {
      this.world.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    
    if (this.waterMesh) {
      this.world.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh.material.dispose();
    }
    
    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];
    
    const waterPositions = [];
    const waterNormals = [];
    const waterColors = [];
    
    const faceOffsets = [
      { dx: 1, dy: 0, dz: 0, normal: [1, 0, 0] },
      { dx: -1, dy: 0, dz: 0, normal: [-1, 0, 0] },
      { dx: 0, dy: 1, dz: 0, normal: [0, 1, 0] },
      { dx: 0, dy: -1, dz: 0, normal: [0, -1, 0] },
      { dx: 0, dy: 0, dz: 1, normal: [0, 0, 1] },
      { dx: 0, dy: 0, dz: -1, normal: [0, 0, -1] },
    ];
    
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = this.getBlock(x, y, z);
          
          if (block.id === BLOCK_AIR) continue;
          
          const isLiquid = block.liquid;
          const worldX = this.worldOffsetX + x;
          const worldZ = this.worldOffsetZ + z;
          
          for (const face of faceOffsets) {
            const neighbor = this.getBlock(x + face.dx, y + face.dy, z + face.dz);
            
            const shouldRender = neighbor.transparent && 
              (!isLiquid || neighbor.id !== block.id);
            
            if (shouldRender) {
              const targetPositions = isLiquid ? waterPositions : positions;
              const targetNormals = isLiquid ? waterNormals : normals;
              const targetColors = isLiquid ? waterColors : colors;
              
              const vertices = this.getFaceVertices(
                x, y, z,
                face.dx, face.dy, face.dz
              );
              
              const normal = face.normal;
              const color = this.getBlockColor(block, face.dy, worldX, y, worldZ);
              
              for (let i = 0; i < 4; i++) {
                targetPositions.push(
                  vertices[i * 3],
                  vertices[i * 3 + 1],
                  vertices[i * 3 + 2]
                );
                targetNormals.push(normal[0], normal[1], normal[2]);
                targetColors.push(color.r, color.g, color.b);
              }
              
              const vertexCount = targetPositions.length / 3;
              const baseIndex = vertexCount - 4;
              
              if (isLiquid) {
              } else {
                if (face.dy === 1) {
                  uvs.push(0, 1, 1, 1, 1, 0, 0, 0);
                } else {
                  uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
                }
              }
            }
          }
        }
      }
    }
    
    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      
      const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
      });
      
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(this.worldOffsetX, 0, this.worldOffsetZ);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.world.scene.add(this.mesh);
    }
    
    if (waterPositions.length > 0) {
      const waterGeometry = new THREE.BufferGeometry();
      waterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      waterGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      waterGeometry.setAttribute('color', new THREE.Float32BufferAttribute(waterColors, 3));
      
      const waterMaterial = new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      
      this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      this.waterMesh.position.set(this.worldOffsetX, 0, this.worldOffsetZ);
      this.world.scene.add(this.waterMesh);
    }
    
    this.isDirty = false;
  }
  
  getFaceVertices(x, y, z, dx, dy, dz) {
    if (dx === 1) {
      return [
        x + 1, y, z,
        x + 1, y + 1, z,
        x + 1, y + 1, z + 1,
        x + 1, y, z + 1,
      ];
    }
    if (dx === -1) {
      return [
        x, y, z + 1,
        x, y + 1, z + 1,
        x, y + 1, z,
        x, y, z,
      ];
    }
    if (dy === 1) {
      return [
        x, y + 1, z,
        x, y + 1, z + 1,
        x + 1, y + 1, z + 1,
        x + 1, y + 1, z,
      ];
    }
    if (dy === -1) {
      return [
        x, y, z + 1,
        x, y, z,
        x + 1, y, z,
        x + 1, y, z + 1,
      ];
    }
    if (dz === 1) {
      return [
        x, y, z + 1,
        x, y + 1, z + 1,
        x + 1, y + 1, z + 1,
        x + 1, y, z + 1,
      ];
    }
    if (dz === -1) {
      return [
        x + 1, y, z,
        x + 1, y + 1, z,
        x, y + 1, z,
        x, y, z,
      ];
    }
    return [];
  }
  
  getBlockColor(block, faceY, worldX, worldY, worldZ) {
    let baseColor = block.color;
    
    if (block.id === BLOCK_GRASS && faceY === 1) {
      const biome = this.world.terrainGenerator.getBiome(worldX, worldZ);
      const temp = (this.world.terrainGenerator.temperatureNoise.fbm(worldX * 0.0015, worldZ * 0.0015, 4) + 1) * 0.5;
      const humidity = (this.world.terrainGenerator.humidityNoise.fbm(worldX * 0.0015, worldZ * 0.0015, 4) + 1) * 0.5;
      
      const grassFactor = temp * 0.6 + humidity * 0.4;
      
      if (biome === 2 || biome === 6) {
        baseColor = 0x90A959;
      } else if (biome === 7 || biome === 4) {
        baseColor = 0x628260;
      } else if (biome === 8) {
        baseColor = 0x5D9B3C;
      } else if (grassFactor > 0.7) {
        baseColor = 0x7FC04F;
      } else {
        baseColor = 0x4CAF50;
      }
    }
    
    let lightFactor = 1.0;
    if (faceY === -1) {
      lightFactor = 0.5;
    } else if (faceY === 1) {
      lightFactor = 1.0;
    } else {
      lightFactor = 0.75;
    }
    
    const r = ((baseColor >> 16) & 0xFF) / 255 * lightFactor;
    const g = ((baseColor >> 8) & 0xFF) / 255 * lightFactor;
    const b = (baseColor & 0xFF) / 255 * lightFactor;
    
    return { r, g, b };
  }
  
  dispose() {
    if (this.mesh) {
      this.world.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      this.world.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh.material.dispose();
      this.waterMesh = null;
    }
    this.blocks = null;
    this.lightMap = null;
  }
}
