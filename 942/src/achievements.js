import { CONFIG } from './config.js';

export class AchievementSystem {
  constructor() {
    this.achievements = JSON.parse(JSON.stringify(CONFIG.ACHIEVEMENTS));
    this.stats = {
      totalKills: 0,
      killsThisLevel: 0,
      killsThisSession: 0,
      lastKillTime: 0,
      damageTakenThisLevel: 0,
      levelsReached: 0,
      weaponsUsed: {
        pistol: false,
        shotgun: false,
        rifle: false
      }
    };
    
    this.unlockedAchievements = [];
  }
  
  checkAchievements() {
    const newUnlocks = [];
    
    if (this.stats.totalKills >= 1 && !this.achievements.firstKill.unlocked) {
      this.achievements.firstKill.unlocked = true;
      newUnlocks.push('firstKill');
    }
    
    if (this.stats.totalKills >= 10 && !this.achievements.tenKills.unlocked) {
      this.achievements.tenKills.unlocked = true;
      newUnlocks.push('tenKills');
    }
    
    if (this.stats.totalKills >= 100 && !this.achievements.hundredKills.unlocked) {
      this.achievements.hundredKills.unlocked = true;
      newUnlocks.push('hundredKills');
    }
    
    if (this.stats.levelsReached >= 3 && !this.achievements.level3.unlocked) {
      this.achievements.level3.unlocked = true;
      newUnlocks.push('level3');
    }
    
    if (this.stats.levelsReached >= 5 && !this.achievements.level5.unlocked) {
      this.achievements.level5.unlocked = true;
      newUnlocks.push('level5');
    }
    
    if (this.stats.levelsReached >= 7 && !this.achievements.maxLevel.unlocked) {
      this.achievements.maxLevel.unlocked = true;
      newUnlocks.push('maxLevel');
    }
    
    if (this.stats.weaponsUsed.shotgun && !this.achievements.shotgunKill.unlocked) {
      this.achievements.shotgunKill.unlocked = true;
      newUnlocks.push('shotgunKill');
    }
    
    if (this.stats.weaponsUsed.rifle && !this.achievements.rifleKill.unlocked) {
      this.achievements.rifleKill.unlocked = true;
      newUnlocks.push('rifleKill');
    }
    
    for (const achievementId of newUnlocks) {
      this.showAchievementPopup(achievementId);
      this.unlockedAchievements.push(achievementId);
    }
    
    return newUnlocks;
  }
  
  onKill(weaponType) {
    const now = performance.now();
    const timeSinceLastKill = now - this.stats.lastKillTime;
    
    if (timeSinceLastKill < 500 && !this.achievements.fastKill.unlocked) {
      this.achievements.fastKill.unlocked = true;
      this.showAchievementPopup('fastKill');
      this.unlockedAchievements.push('fastKill');
    }
    
    this.stats.totalKills++;
    this.stats.killsThisLevel++;
    this.stats.killsThisSession++;
    this.stats.lastKillTime = now;
    
    if (weaponType === 'shotgun') {
      this.stats.weaponsUsed.shotgun = true;
    } else if (weaponType === 'rifle') {
      this.stats.weaponsUsed.rifle = true;
    }
    
    return this.checkAchievements();
  }
  
  onDamageTaken() {
    this.stats.damageTakenThisLevel++;
  }
  
  onLevelComplete() {
    if (this.stats.damageTakenThisLevel === 0 && !this.achievements.noDamageLevel.unlocked) {
      this.achievements.noDamageLevel.unlocked = true;
      this.showAchievementPopup('noDamageLevel');
      this.unlockedAchievements.push('noDamageLevel');
    }
    
    this.stats.killsThisLevel = 0;
    this.stats.damageTakenThisLevel = 0;
  }
  
  onLevelStart(level) {
    if (level > this.stats.levelsReached) {
      this.stats.levelsReached = level;
    }
    
    this.checkAchievements();
  }
  
  showAchievementPopup(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement) return;
    
    const container = document.getElementById('achievements');
    
    const popup = document.createElement('div');
    popup.className = 'achievement-item';
    popup.innerHTML = `
      <div>🏆 成就解锁!</div>
      <div><strong>${achievement.name}</strong></div>
      <div style="font-size: 12px;">${achievement.description}</div>
    `;
    
    container.appendChild(popup);
    
    setTimeout(() => {
      popup.style.transition = 'opacity 0.5s';
      popup.style.opacity = '0';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 500);
    }, 3000);
  }
  
  getTotalKills() {
    return this.stats.totalKills;
  }
  
  getKillsThisSession() {
    return this.stats.killsThisSession;
  }
  
  getUnlockedAchievements() {
    return this.unlockedAchievements;
  }
  
  reset() {
    this.stats.killsThisSession = 0;
    this.stats.killsThisLevel = 0;
    this.stats.damageTakenThisLevel = 0;
    this.stats.lastKillTime = 0;
  }
}
