import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { Weapon } from './weapon.js';
import { Level } from './level.js';
import { AchievementSystem } from './achievements.js';
import { CONFIG } from './config.js';
import { InputManager } from './input.js';

class Game {
  constructor() {
    this.renderer = null;
    this.player = null;
    this.weapon = null;
    this.level = null;
    this.achievements = null;
    
    this.gameState = 'start';
    this.score = 0;
    this.totalKills = 0;
    
    this.animationId = null;
    this.init();
  }
  
  init() {
    InputManager.init();
    
    this.renderer = new Renderer();
    this.player = new Player(this.renderer.camera, this.renderer.scene);
    this.level = new Level(this.renderer.scene);
    this.achievements = new AchievementSystem();
    
    this.level.init();
    
    this.setupEventListeners();
    this.updateHealthUI();
  }
  
  setupEventListeners() {
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const resumeButton = document.getElementById('resume-button');
    const quitButton = document.getElementById('quit-button');
    
    startButton.addEventListener('click', () => this.startGame());
    restartButton.addEventListener('click', () => this.restartGame());
    resumeButton.addEventListener('click', () => this.resumeGame());
    quitButton.addEventListener('click', () => this.quitGame());
    
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.gameState === 'playing') {
          this.pauseGame();
        } else if (this.gameState === 'paused') {
          this.resumeGame();
        }
      }
    });
  }
  
  startGame() {
    this.gameState = 'playing';
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    
    InputManager.showKeyDisplay();
    
    this.score = 0;
    this.totalKills = 0;
    this.player.reset();
    this.level.reset();
    this.achievements.reset();
    
    this.switchWeapon('pistol');
    this.level.startLevel(1);
    this.achievements.onLevelStart(1);
    
    this.updateScoreUI();
    this.updateHealthUI();
    this.updateKillsUI();
    
    this.player.lockPointer();
    
    this.gameLoop();
  }
  
  switchWeapon(type) {
    if (this.weapon) {
      this.weapon.reset();
    }
    this.weapon = new Weapon(type, this.renderer.scene, this.renderer.camera);
    this.weapon.updateUI();
  }
  
  pauseGame() {
    if (this.gameState !== 'playing') return;
    
    this.gameState = 'paused';
    document.getElementById('pause-screen').classList.remove('hidden');
    InputManager.hideKeyDisplay();
    this.player.unlockPointer();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  resumeGame() {
    if (this.gameState !== 'paused') return;
    
    this.gameState = 'playing';
    document.getElementById('pause-screen').classList.add('hidden');
    InputManager.showKeyDisplay();
    this.player.lockPointer();
    
    this.gameLoop();
  }
  
  quitGame() {
    this.gameState = 'start';
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    InputManager.hideKeyDisplay();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  gameOver() {
    this.gameState = 'gameover';
    document.getElementById('game-over-screen').classList.remove('hidden');
    InputManager.hideKeyDisplay();
    
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-kills').textContent = this.achievements.getKillsThisSession();
    document.getElementById('final-level').textContent = this.level.getCurrentLevel();
    
    this.player.unlockPointer();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  restartGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    this.startGame();
  }
  
  gameLoop() {
    if (this.gameState !== 'playing') return;
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
    
    const deltaTime = this.renderer.getDeltaTime();
    
    this.player.update(deltaTime, this.level.getWalls());
    
    const recoil = this.weapon ? this.weapon.getRecoil() : 0;
    const recoilX = this.weapon ? this.weapon.getRecoilX() : 0;
    const recoilY = this.weapon ? this.weapon.getRecoilY() : 0;
    
    if (recoil > 0) {
      this.renderer.camera.rotation.x += recoil * 0.5;
      this.player.rotation.x = this.renderer.camera.rotation.x;
    }
    
    if (recoilX > 0 || recoilY > 0) {
      this.renderer.camera.rotation.x += recoilX;
      this.renderer.camera.rotation.y += (Math.random() - 0.5) * recoilY * 2;
      this.player.rotation.x = this.renderer.camera.rotation.x;
      this.player.rotation.y = this.renderer.camera.rotation.y;
      
      this.weapon.clearTargetRecoil();
    }
    
    const playerPosition = this.player.getPosition();
    const enemyAttacks = this.level.update(deltaTime, playerPosition);
    
    for (const attack of enemyAttacks) {
      if (attack.shouldAttack) {
        const isDead = this.player.takeDamage(attack.damage);
        this.updateHealthUI();
        this.achievements.onDamageTaken();
        
        if (isDead) {
          this.gameOver();
          return;
        }
      }
    }
    
    if (this.weapon) {
      const hitEnemies = this.weapon.update(deltaTime, this.level.getEnemies(), this.level.getWalls());
      
      for (const hit of hitEnemies) {
        const isDead = hit.enemy.takeDamage(hit.damage);
        
        if (isDead) {
          const scoreGained = this.level.onEnemyKilled(hit.enemy);
          this.score += scoreGained;
          this.totalKills++;
          
          this.achievements.onKill(this.weapon.type);
          
          this.updateScoreUI();
          this.updateKillsUI();
        }
      }
    }
    
    if (this.level.isComplete()) {
      this.nextLevel();
    }
    
    this.renderer.render();
  }
  
  nextLevel() {
    const nextLevelNum = this.level.getCurrentLevel() + 1;
    
    this.achievements.onLevelComplete();
    this.player.heal(30);
    this.updateHealthUI();
    
    this.level.startLevel(nextLevelNum);
    this.achievements.onLevelStart(nextLevelNum);
    
    if (nextLevelNum === 3) {
      this.switchWeapon('shotgun');
      this.showLevelMessage('获得新武器: 像素霰弹枪!');
    } else if (nextLevelNum === 5) {
      this.switchWeapon('rifle');
      this.showLevelMessage('获得新武器: 像素步枪!');
    }
    
    this.showLevelMessage(`关卡 ${nextLevelNum} 开始!`);
  }
  
  showLevelMessage(message) {
    const instructions = document.getElementById('instructions');
    instructions.innerHTML = `<div style="font-size: 24px;">${message}</div>`;
    instructions.classList.remove('hidden');
    
    setTimeout(() => {
      instructions.classList.add('hidden');
    }, 2000);
  }
  
  updateHealthUI() {
    const healthFill = document.getElementById('health-fill');
    const healthPercent = (this.player.health / this.player.maxHealth) * 100;
    healthFill.style.width = `${healthPercent}%`;
    
    if (healthPercent < 30) {
      healthFill.style.background = '#ff0000';
    } else if (healthPercent < 60) {
      healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
    } else {
      healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff6600, #00ff00)';
    }
  }
  
  updateScoreUI() {
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.textContent = `得分: ${this.score}`;
  }
  
  updateKillsUI() {
    const killsCount = document.getElementById('kills-count');
    killsCount.textContent = `击杀: ${this.achievements.getKillsThisSession()}`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
