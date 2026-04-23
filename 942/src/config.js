export const CONFIG = {
  GAME: {
    enemySpeedMultiplier: 0.75
  },
  
  PLAYER: {
    speed: 0.15,
    sprintMultiplier: 1.5,
    jumpForce: 0.25,
    gravity: 0.01,
    maxHealth: 100,
    height: 1.8,
    radius: 0.5
  },
  
  WEAPON: {
    pistol: {
      name: '像素手枪',
      damage: 25,
      fireRate: 300,
      maxAmmo: 30,
      reserveAmmo: 120,
      reloadTime: 1500,
      spread: 0.02,
      bulletSpeed: 100,
      bulletLifetime: 2000,
      recoil: 0.025,
      recoilY: 0.01,
      recoilX: 0.005
    },
    shotgun: {
      name: '像素霰弹枪',
      damage: 15,
      fireRate: 800,
      maxAmmo: 8,
      reserveAmmo: 48,
      reloadTime: 2000,
      spread: 0.15,
      pellets: 8,
      bulletSpeed: 80,
      bulletLifetime: 1500,
      recoil: 0.08,
      recoilY: 0.03,
      recoilX: 0.015
    },
    rifle: {
      name: '像素步枪',
      damage: 35,
      fireRate: 150,
      maxAmmo: 50,
      reserveAmmo: 200,
      reloadTime: 2500,
      spread: 0.01,
      bulletSpeed: 150,
      bulletLifetime: 3000,
      recoil: 0.015,
      recoilY: 0.008,
      recoilX: 0.003
    }
  },
  
  ENEMY: {
    basic: {
      name: '基础敌人',
      health: 50,
      speed: 0.05,
      damage: 10,
      attackRange: 2,
      attackCooldown: 1000,
      score: 100,
      color: 0xff0000,
      size: 1
    },
    fast: {
      name: '快速敌人',
      health: 30,
      speed: 0.12,
      damage: 8,
      attackRange: 1.5,
      attackCooldown: 800,
      score: 150,
      color: 0x00ff00,
      size: 0.8
    },
    tank: {
      name: '重型敌人',
      health: 150,
      speed: 0.03,
      damage: 25,
      attackRange: 3,
      attackCooldown: 2000,
      score: 300,
      color: 0x0000ff,
      size: 1.5
    }
  },
  
  LEVEL: {
    maxEnemiesPerLevel: [5, 8, 12, 16, 20, 25, 30],
    spawnRate: [3000, 2500, 2000, 1800, 1500, 1200, 1000],
    enemyTypesPerLevel: [
      ['basic'],
      ['basic', 'basic', 'fast'],
      ['basic', 'basic', 'fast', 'fast'],
      ['basic', 'fast', 'fast', 'tank'],
      ['basic', 'fast', 'fast', 'tank', 'tank'],
      ['fast', 'fast', 'fast', 'tank', 'tank'],
      ['fast', 'tank', 'tank', 'tank', 'tank']
    ]
  },
  
  ACHIEVEMENTS: {
    firstKill: { name: '初次击杀', description: '击杀第一个敌人', unlocked: false },
    tenKills: { name: '连击新手', description: '累计击杀10个敌人', unlocked: false },
    hundredKills: { name: '杀戮机器', description: '累计击杀100个敌人', unlocked: false },
    noDamageLevel: { name: '完美躲避', description: '在一个关卡中不受伤害', unlocked: false },
    fastKill: { name: '闪电反应', description: '在0.5秒内击杀两个敌人', unlocked: false },
    level3: { name: '初露锋芒', description: '到达第3关', unlocked: false },
    level5: { name: '生存专家', description: '到达第5关', unlocked: false },
    maxLevel: { name: '终极战士', description: '到达第7关', unlocked: false },
    shotgunKill: { name: '近距离专家', description: '使用霰弹枪击杀敌人', unlocked: false },
    rifleKill: { name: '远程大师', description: '使用步枪击杀敌人', unlocked: false }
  },
  
  WORLD: {
    floorSize: 100,
    wallHeight: 5,
    pixelResolution: 64
  }
};
