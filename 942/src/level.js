import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Enemy } from './enemy.js';

export class Level {
  constructor(scene) {
    this.scene = scene;
    this.currentLevel = 1;
    this.maxLevel = CONFIG.LEVEL.maxEnemiesPerLevel.length;
    
    this.walls = [];
    this.enemies = [];
    this.spawnPoints = [];
    
    this.enemiesKilledThisLevel = 0;
    this.totalEnemiesToKill = 0;
    this.isLevelComplete = false;
    
    this.lastSpawnTime = 0;
    this.enemiesSpawnedThisLevel = 0;
    this.levelStartTime = 0;
    this.startDelay = 5000;
  }
  
  init() {
    this.createFloor();
    this.createWalls();
    this.createObstacles();
    this.generateSpawnPoints();
  }
  
  createFloor() {
    const size = CONFIG.WORLD.floorSize;
    
    const floorGeometry = new THREE.PlaneGeometry(size, size, 32, 32);
    floorGeometry.rotateX(-Math.PI / 2);
    
    const floorTexture = this.createPixelFloorTexture();
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      map: floorTexture,
      flatShading: true
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.receiveShadow = false;
    this.scene.add(floor);
  }
  
  createPixelFloorTexture() {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const colors = [
      '#2d2d2d', '#3d3d3d', '#4d4d4d', '#5d5d5d',
      '#2a2a2a', '#3a3a3a', '#4a4a4a'
    ];
    
    const pixelSize = 16;
    
    for (let x = 0; x < size; x += pixelSize) {
      for (let y = 0; y < size; y += pixelSize) {
        const colorIndex = Math.floor(Math.random() * colors.length);
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(x, y, pixelSize, pixelSize);
        
        if (Math.random() > 0.7) {
          ctx.fillStyle = colors[(colorIndex + 1) % colors.length];
          ctx.fillRect(x + 2, y + 2, 4, 4);
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    
    return texture;
  }
  
  createWalls() {
    const size = CONFIG.WORLD.floorSize;
    const height = CONFIG.WORLD.wallHeight;
    
    const wallPositions = [
      { x: 0, z: -size / 2, width: size, depth: 1 },
      { x: 0, z: size / 2, width: size, depth: 1 },
      { x: -size / 2, z: 0, width: 1, depth: size },
      { x: size / 2, z: 0, width: 1, depth: size }
    ];
    
    const wallTexture = this.createPixelWallTexture();
    
    wallPositions.forEach(pos => {
      const wallGeometry = new THREE.BoxGeometry(pos.width, height, pos.depth);
      const wallMaterial = new THREE.MeshLambertMaterial({ 
        map: wallTexture,
        flatShading: true
      });
      
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos.x, height / 2, pos.z);
      wall.castShadow = false;
      wall.receiveShadow = false;
      
      this.scene.add(wall);
      
      wall.userData = {
        boundingBox: new THREE.Box3().setFromObject(wall),
        isWall: true
      };
      
      this.walls.push(wall);
    });
  }
  
  createPixelWallTexture() {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const colors = [
      '#4a6741', '#5a7751', '#6a8761', '#3a5731'
    ];
    
    const brickWidth = 32;
    const brickHeight = 16;
    
    for (let row = 0; row < size / brickHeight; row++) {
      const offset = (row % 2 === 0) ? 0 : brickWidth / 2;
      
      for (let col = -1; col <= size / brickWidth; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        
        const colorIndex = Math.floor(Math.random() * colors.length);
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(x, y, brickWidth - 2, brickHeight - 2);
        
        ctx.fillStyle = '#2a3721';
        ctx.fillRect(x + brickWidth - 2, y, 2, brickHeight);
        ctx.fillRect(x, y + brickHeight - 2, brickWidth, 2);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    
    return texture;
  }
  
  createObstacles() {
    const obstaclePositions = [
      { x: -15, z: -15, size: 3 },
      { x: 15, z: -15, size: 4 },
      { x: -15, z: 15, size: 3.5 },
      { x: 15, z: 15, size: 3 },
      { x: -25, z: 0, size: 3 },
      { x: 25, z: 0, size: 3 },
      { x: 0, z: -25, size: 4 },
      { x: 0, z: 25, size: 4 },
      { x: -20, z: -20, size: 2.5 },
      { x: 20, z: 20, size: 2.5 },
      { x: -20, z: 20, size: 3 },
      { x: 20, z: -20, size: 3 }
    ];
    
    obstaclePositions.forEach((pos, index) => {
      const height = pos.size * (1 + Math.random() * 0.5);
      
      const geometry = new THREE.BoxGeometry(pos.size, height, pos.size);
      
      const colors = [0x8B4513, 0x654321, 0xA0522D, 0x8B0000];
      const color = colors[index % colors.length];
      
      const texture = this.createObstacleTexture(color);
      const material = new THREE.MeshLambertMaterial({ 
        map: texture,
        flatShading: true
      });
      
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(pos.x, height / 2, pos.z);
      
      this.scene.add(obstacle);
      
      obstacle.userData = {
        boundingBox: new THREE.Box3().setFromObject(obstacle),
        isObstacle: true
      };
      
      this.walls.push(obstacle);
    });
  }
  
  createObstacleTexture(baseColor) {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const color = new THREE.Color(baseColor);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);
    
    const pixelSize = 8;
    
    for (let x = 0; x < size; x += pixelSize) {
      for (let y = 0; y < size; y += pixelSize) {
        const variation = Math.random() * 40 - 20;
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + variation))}, ${Math.max(0, Math.min(255, g + variation))}, ${Math.max(0, Math.min(255, b + variation))})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
  
  generateSpawnPoints() {
    const size = CONFIG.WORLD.floorSize * 0.4;
    const margin = 10;
    
    const points = [
      { x: -size, z: -size },
      { x: size, z: -size },
      { x: -size, z: size },
      { x: size, z: size },
      { x: 0, z: -size },
      { x: 0, z: size },
      { x: -size, z: 0 },
      { x: size, z: 0 },
      { x: -size * 0.7, z: -size * 0.7 },
      { x: size * 0.7, z: -size * 0.7 },
      { x: -size * 0.7, z: size * 0.7 },
      { x: size * 0.7, z: size * 0.7 }
    ];
    
    this.spawnPoints = points.map(p => new THREE.Vector3(p.x, 0, p.z));
  }
  
  startLevel(level) {
    this.currentLevel = level;
    this.enemiesKilledThisLevel = 0;
    this.isLevelComplete = false;
    this.enemiesSpawnedThisLevel = 0;
    this.lastSpawnTime = 0;
    this.levelStartTime = performance.now();
    
    const levelIndex = Math.min(level - 1, CONFIG.LEVEL.maxEnemiesPerLevel.length - 1);
    this.totalEnemiesToKill = CONFIG.LEVEL.maxEnemiesPerLevel[levelIndex];
    
    this.clearEnemies();
    
    this.updateLevelUI();
  }
  
  update(deltaTime, playerPosition) {
    if (this.isLevelComplete) return null;
    
    const now = performance.now();
    const timeSinceLevelStart = now - this.levelStartTime;
    
    if (timeSinceLevelStart < this.startDelay) {
      return [];
    }
    
    const levelIndex = Math.min(this.currentLevel - 1, CONFIG.LEVEL.maxEnemiesPerLevel.length - 1);
    const spawnRate = CONFIG.LEVEL.spawnRate[levelIndex];
    
    const aliveEnemies = this.enemies.filter(e => !e.isDead).length;
    const maxAlive = Math.min(5, this.totalEnemiesToKill - this.enemiesKilledThisLevel - aliveEnemies + 1);
    
    if (this.enemiesSpawnedThisLevel < this.totalEnemiesToKill && 
        aliveEnemies < maxAlive &&
        now - this.lastSpawnTime > spawnRate) {
      
      this.spawnEnemy(playerPosition);
      this.lastSpawnTime = now;
    }
    
    return this.updateEnemies(deltaTime, playerPosition);
  }
  
  spawnEnemy(playerPosition) {
    const levelIndex = Math.min(this.currentLevel - 1, CONFIG.LEVEL.enemyTypesPerLevel.length - 1);
    const types = CONFIG.LEVEL.enemyTypesPerLevel[levelIndex];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let spawnPoint;
    let attempts = 0;
    
    do {
      spawnPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
      attempts++;
    } while (spawnPoint.distanceTo(playerPosition) < 15 && attempts < 10);
    
    const offsetX = (Math.random() - 0.5) * 5;
    const offsetZ = (Math.random() - 0.5) * 5;
    const finalPosition = spawnPoint.clone().add(new THREE.Vector3(offsetX, 0, offsetZ));
    
    const enemy = new Enemy(type, finalPosition, this.scene);
    this.enemies.push(enemy);
    this.enemiesSpawnedThisLevel++;
    
    this.updateEnemyCountUI();
  }
  
  updateEnemies(deltaTime, playerPosition) {
    const attacks = [];
    
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      
      const attackResult = enemy.update(deltaTime, playerPosition);
      if (attackResult.shouldAttack) {
        attacks.push(attackResult);
      }
    }
    
    return attacks;
  }
  
  onEnemyKilled(enemy) {
    this.enemiesKilledThisLevel++;
    
    if (this.enemiesKilledThisLevel >= this.totalEnemiesToKill) {
      this.isLevelComplete = true;
    }
    
    this.updateEnemyCountUI();
    
    return enemy.config.score;
  }
  
  clearEnemies() {
    for (const enemy of this.enemies) {
      if (enemy.mesh) {
        this.scene.remove(enemy.mesh);
      }
    }
    this.enemies = [];
  }
  
  updateLevelUI() {
    const levelDisplay = document.getElementById('level-display');
    levelDisplay.textContent = `关卡: ${this.currentLevel}`;
  }
  
  updateEnemyCountUI() {
    const enemyCount = document.getElementById('enemy-count');
    const alive = this.enemies.filter(e => !e.isDead).length;
    const remaining = this.totalEnemiesToKill - this.enemiesKilledThisLevel;
    enemyCount.textContent = `敌人: ${alive} (剩余: ${remaining})`;
  }
  
  getWalls() {
    return this.walls;
  }
  
  getEnemies() {
    return this.enemies.filter(e => !e.isDead);
  }
  
  isComplete() {
    return this.isLevelComplete;
  }
  
  getCurrentLevel() {
    return this.currentLevel;
  }
  
  reset() {
    this.clearEnemies();
    this.currentLevel = 1;
    this.enemiesKilledThisLevel = 0;
    this.isLevelComplete = false;
    this.enemiesSpawnedThisLevel = 0;
  }
}
