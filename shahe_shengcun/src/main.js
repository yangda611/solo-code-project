import * as THREE from 'three';
import { World } from './world/World.js';
import { PlayerController } from './player/PlayerController.js';
import { DayNightCycle } from './world/DayNightCycle.js';
import { FluidSimulator } from './world/FluidSimulator.js';
import { CraftingManager } from './inventory/Crafting.js';
import { BIOME_NAMES } from './utils/Constants.js';

class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
    
    this.canvas = document.getElementById('game-canvas');
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.order = 'YXZ';
    
    this.world = new World(this.scene);
    this.playerController = new PlayerController(this.camera, this.world, this.canvas);
    this.dayNightCycle = new DayNightCycle(this.scene);
    this.fluidSimulator = new FluidSimulator(this.world);
    this.craftingManager = new CraftingManager();
    
    this.spawnPlayer();
    
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTime = 0;
    this.fps = 60;
    
    this.setupEventListeners();
    
    this.isRunning = true;
    this.animate();
  }
  
  spawnPlayer() {
    const spawnX = 0;
    const spawnZ = 0;
    
    this.world.preloadChunksAround(spawnX, spawnZ, 3);
    this.world.processAllRebuilds();
    
    const surfaceHeight = this.world.getSurfaceHeight(spawnX, spawnZ);
    const spawnY = surfaceHeight + 3;
    
    this.playerController.position.set(spawnX, spawnY, spawnZ);
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    this.frameCount++;
    this.fpsTime += deltaTime;
    
    if (this.fpsTime >= 1.0) {
      this.fps = Math.round(this.frameCount / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;
      this.updateDebugInfo();
    }
  }
  
  update(deltaTime) {
    this.playerController.update(deltaTime);
    this.world.update(this.playerController.position.x, this.playerController.position.z);
    this.dayNightCycle.update(deltaTime, this.playerController.position);
    this.fluidSimulator.update(deltaTime);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  updateDebugInfo() {
    const fpsElement = document.getElementById('fps');
    const positionElement = document.getElementById('position');
    const chunksElement = document.getElementById('chunks');
    const biomeElement = document.getElementById('biome');
    
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${this.fps}`;
    }
    
    if (positionElement) {
      const pos = this.playerController.position;
      positionElement.textContent = `位置: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
    }
    
    if (chunksElement) {
      chunksElement.textContent = `区块: ${this.world.getLoadedChunksCount()}`;
    }
    
    if (biomeElement) {
      const biomeId = this.world.getBiomeAt(
        Math.floor(this.playerController.position.x),
        Math.floor(this.playerController.position.z)
      );
      biomeElement.textContent = `生物群系: ${BIOME_NAMES[biomeId] || '未知'}`;
    }
  }
  
  stop() {
    this.isRunning = false;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('沙河生存 - 无限开放世界沙盒生存游戏');
  console.log('点击游戏画面开始游戏');
  console.log('WASD: 移动 | 鼠标: 视角 | 空格: 跳跃');
  console.log('左键: 挖掘 | 右键: 放置 | 1-9: 切换物品');
  
  new Game();
});
