import * as THREE from 'three';
import { CONFIG } from './config.js';
import { InputManager } from './input.js';

export class Weapon {
  constructor(type, scene, camera) {
    this.type = type;
    this.config = CONFIG.WEAPON[type];
    this.scene = scene;
    this.camera = camera;
    
    this.currentAmmo = this.config.maxAmmo;
    this.reserveAmmo = this.config.reserveAmmo;
    
    this.isReloading = false;
    this.lastShotTime = 0;
    this.recoilAmount = 0;
    this.recoilX = 0;
    this.recoilY = 0;
    this.targetRecoilX = 0;
    this.targetRecoilY = 0;
    
    this.bullets = [];
    this.muzzleFlash = null;
    this.weaponMesh = null;
    this.weaponGroup = null;
    
    this.wasRPressed = false;
    this.autoReloadTriggered = false;
    
    this.init();
  }
  
  init() {
    this.createWeaponModel();
    this.createMuzzleFlash();
  }
  
  createWeaponModel() {
    this.weaponGroup = new THREE.Group();
    
    if (this.type === 'pistol') {
      this.createPistolModel();
    } else if (this.type === 'shotgun') {
      this.createShotgunModel();
    } else if (this.type === 'rifle') {
      this.createRifleModel();
    }
    
    this.camera.add(this.weaponGroup);
    this.weaponGroup.position.set(0.3, -0.2, -0.5);
  }
  
  createPistolModel() {
    const materials = {
      metal: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true }),
      grip: new THREE.MeshLambertMaterial({ color: 0x8B4513, flatShading: true }),
      barrel: new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true }),
      trigger: new THREE.MeshLambertMaterial({ color: 0xffd700, flatShading: true })
    };
    
    const slideGeo = new THREE.BoxGeometry(0.08, 0.05, 0.22);
    const slide = new THREE.Mesh(slideGeo, materials.metal);
    slide.position.set(0, 0.04, 0);
    this.weaponGroup.add(slide);
    
    const barrelGeo = new THREE.BoxGeometry(0.035, 0.035, 0.12);
    const barrel = new THREE.Mesh(barrelGeo, materials.barrel);
    barrel.position.set(0, 0.04, -0.17);
    this.weaponGroup.add(barrel);
    
    const sightGeo = new THREE.BoxGeometry(0.015, 0.02, 0.015);
    const frontSight = new THREE.Mesh(sightGeo, materials.metal);
    frontSight.position.set(0, 0.075, -0.22);
    this.weaponGroup.add(frontSight);
    
    const rearSight = new THREE.Mesh(sightGeo, materials.metal);
    rearSight.position.set(0, 0.075, 0.1);
    this.weaponGroup.add(rearSight);
    
    const frameGeo = new THREE.BoxGeometry(0.07, 0.035, 0.16);
    const frame = new THREE.Mesh(frameGeo, materials.metal);
    frame.position.set(0, 0.0175, 0);
    this.weaponGroup.add(frame);
    
    const gripGeo = new THREE.BoxGeometry(0.055, 0.1, 0.07);
    const grip = new THREE.Mesh(gripGeo, materials.grip);
    grip.position.set(0, -0.035, 0.03);
    grip.rotation.x = -0.15;
    this.weaponGroup.add(grip);
    
    const magGeo = new THREE.BoxGeometry(0.04, 0.07, 0.035);
    const mag = new THREE.Mesh(magGeo, materials.metal);
    mag.position.set(0, -0.075, 0.05);
    this.weaponGroup.add(mag);
    
    const triggerGuardGeo = new THREE.BoxGeometry(0.035, 0.015, 0.07);
    const triggerGuard = new THREE.Mesh(triggerGuardGeo, materials.metal);
    triggerGuard.position.set(0, -0.0025, 0.02);
    this.weaponGroup.add(triggerGuard);
    
    const triggerGeo = new THREE.BoxGeometry(0.012, 0.025, 0.02);
    const trigger = new THREE.Mesh(triggerGeo, materials.trigger);
    trigger.position.set(0, -0.005, 0.02);
    this.weaponGroup.add(trigger);
    
    const ejectionPortGeo = new THREE.BoxGeometry(0.03, 0.005, 0.04);
    const ejectionPortMat = new THREE.MeshLambertMaterial({ color: 0x000000, flatShading: true });
    const ejectionPort = new THREE.Mesh(ejectionPortGeo, ejectionPortMat);
    ejectionPort.position.set(-0.02, 0.065, -0.05);
    this.weaponGroup.add(ejectionPort);
  }
  
  createShotgunModel() {
    const materials = {
      metal: new THREE.MeshLambertMaterial({ color: 0x4a4a4a, flatShading: true }),
      wood: new THREE.MeshLambertMaterial({ color: 0x8B4513, flatShading: true }),
      barrel: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true }),
      darkMetal: new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true })
    };
    
    const barrelGeo = new THREE.BoxGeometry(0.05, 0.05, 0.45);
    const barrel = new THREE.Mesh(barrelGeo, materials.barrel);
    barrel.position.set(0, 0.035, -0.1);
    this.weaponGroup.add(barrel);
    
    const barrel2 = barrel.clone();
    barrel2.position.set(0, 0.07, -0.1);
    this.weaponGroup.add(barrel2);
    
    const muzzleGeo = new THREE.BoxGeometry(0.065, 0.09, 0.04);
    const muzzle = new THREE.Mesh(muzzleGeo, materials.darkMetal);
    muzzle.position.set(0, 0.0525, -0.345);
    this.weaponGroup.add(muzzle);
    
    const receiverGeo = new THREE.BoxGeometry(0.1, 0.1, 0.22);
    const receiver = new THREE.Mesh(receiverGeo, materials.metal);
    receiver.position.set(0, 0.05, 0.1);
    this.weaponGroup.add(receiver);
    
    const sightGeo = new THREE.BoxGeometry(0.02, 0.03, 0.02);
    const frontSight = new THREE.Mesh(sightGeo, materials.metal);
    frontSight.position.set(0, 0.11, -0.32);
    this.weaponGroup.add(frontSight);
    
    const rearSight = new THREE.Mesh(sightGeo, materials.metal);
    rearSight.position.set(0, 0.11, 0.18);
    this.weaponGroup.add(rearSight);
    
    const foreEndGeo = new THREE.BoxGeometry(0.09, 0.07, 0.2);
    const foreEnd = new THREE.Mesh(foreEndGeo, materials.wood);
    foreEnd.position.set(0, 0.015, -0.05);
    this.weaponGroup.add(foreEnd);
    
    const stockGeo = new THREE.BoxGeometry(0.07, 0.12, 0.25);
    const stock = new THREE.Mesh(stockGeo, materials.wood);
    stock.position.set(0, 0.02, 0.28);
    stock.rotation.x = 0.08;
    this.weaponGroup.add(stock);
    
    const stockTopGeo = new THREE.BoxGeometry(0.055, 0.05, 0.15);
    const stockTop = new THREE.Mesh(stockTopGeo, materials.wood);
    stockTop.position.set(0, 0.08, 0.23);
    stockTop.rotation.x = 0.08;
    this.weaponGroup.add(stockTop);
    
    const guardGeo = new THREE.BoxGeometry(0.05, 0.02, 0.1);
    const triggerGuard = new THREE.Mesh(guardGeo, materials.metal);
    triggerGuard.position.set(0, -0.02, 0.12);
    this.weaponGroup.add(triggerGuard);
    
    const triggerGeo = new THREE.BoxGeometry(0.015, 0.03, 0.03);
    const trigger = new THREE.Mesh(triggerGeo, materials.darkMetal);
    trigger.position.set(0, -0.005, 0.11);
    this.weaponGroup.add(trigger);
    
    const loadingPortGeo = new THREE.BoxGeometry(0.06, 0.02, 0.08);
    const loadingPortMat = new THREE.MeshLambertMaterial({ color: 0x000000, flatShading: true });
    const loadingPort = new THREE.Mesh(loadingPortGeo, loadingPortMat);
    loadingPort.position.set(0, 0.09, 0.14);
    this.weaponGroup.add(loadingPort);
  }
  
  createRifleModel() {
    const materials = {
      metal: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, flatShading: true }),
      darkMetal: new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true }),
      grip: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true }),
      barrel: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true })
    };
    
    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, materials.barrel);
    barrel.position.set(0, 0.05, -0.15);
    this.weaponGroup.add(barrel);
    
    const flashHiderGeo = new THREE.CylinderGeometry(0.018, 0.015, 0.05, 8);
    flashHiderGeo.rotateX(Math.PI / 2);
    const flashHider = new THREE.Mesh(flashHiderGeo, materials.darkMetal);
    flashHider.position.set(0, 0.05, -0.375);
    this.weaponGroup.add(flashHider);
    
    const upperReceiverGeo = new THREE.BoxGeometry(0.055, 0.06, 0.3);
    const upperReceiver = new THREE.Mesh(upperReceiverGeo, materials.metal);
    upperReceiver.position.set(0, 0.05, 0.03);
    this.weaponGroup.add(upperReceiver);
    
    const lowerReceiverGeo = new THREE.BoxGeometry(0.05, 0.05, 0.22);
    const lowerReceiver = new THREE.Mesh(lowerReceiverGeo, materials.metal);
    lowerReceiver.position.set(0, 0.005, 0.07);
    this.weaponGroup.add(lowerReceiver);
    
    const railGeo = new THREE.BoxGeometry(0.04, 0.015, 0.28);
    const rail = new THREE.Mesh(railGeo, materials.darkMetal);
    rail.position.set(0, 0.09, 0.04);
    this.weaponGroup.add(rail);
    
    for (let i = 0; i < 14; i++) {
      const railSlotGeo = new THREE.BoxGeometry(0.008, 0.008, 0.008);
      const railSlot = new THREE.Mesh(railSlotGeo, materials.metal);
      railSlot.position.set(0, 0.095, -0.09 + i * 0.015);
      this.weaponGroup.add(railSlot);
    }
    
    const scopeBaseGeo = new THREE.BoxGeometry(0.035, 0.03, 0.08);
    const scopeBase = new THREE.Mesh(scopeBaseGeo, materials.darkMetal);
    scopeBase.position.set(0, 0.115, 0.02);
    this.weaponGroup.add(scopeBase);
    
    const scopeTubeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
    scopeTubeGeo.rotateX(Math.PI / 2);
    const scopeTube = new THREE.Mesh(scopeTubeGeo, materials.darkMetal);
    scopeTube.position.set(0, 0.14, 0.02);
    this.weaponGroup.add(scopeTube);
    
    const opticGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8);
    opticGeo.rotateX(Math.PI / 2);
    const frontOptic = new THREE.Mesh(opticGeo, new THREE.MeshLambertMaterial({ color: 0x00aaff, flatShading: true }));
    frontOptic.position.set(0, 0.14, -0.04);
    this.weaponGroup.add(frontOptic);
    
    const pistolGripGeo = new THREE.BoxGeometry(0.04, 0.1, 0.055);
    const pistolGrip = new THREE.Mesh(pistolGripGeo, materials.grip);
    pistolGrip.position.set(0, -0.035, 0.12);
    pistolGrip.rotation.x = -0.2;
    this.weaponGroup.add(pistolGrip);
    
    const magGeo = new THREE.BoxGeometry(0.04, 0.12, 0.06);
    const mag = new THREE.Mesh(magGeo, materials.darkMetal);
    mag.position.set(0, -0.06, 0.04);
    mag.rotation.x = -0.1;
    this.weaponGroup.add(mag);
    
    const foreGripGeo = new THREE.BoxGeometry(0.035, 0.06, 0.04);
    const foreGrip = new THREE.Mesh(foreGripGeo, materials.grip);
    foreGrip.position.set(0, -0.015, -0.08);
    this.weaponGroup.add(foreGrip);
    
    const stockTubeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
    stockTubeGeo.rotateX(Math.PI / 2);
    const stockTube = new THREE.Mesh(stockTubeGeo, materials.metal);
    stockTube.position.set(0, 0.035, 0.2);
    this.weaponGroup.add(stockTube);
    
    const stockGeo = new THREE.BoxGeometry(0.06, 0.08, 0.12);
    const stock = new THREE.Mesh(stockGeo, materials.metal);
    stock.position.set(0, 0.035, 0.28);
    this.weaponGroup.add(stock);
    
    const stockPadGeo = new THREE.BoxGeometry(0.065, 0.085, 0.025);
    const stockPad = new THREE.Mesh(stockPadGeo, materials.grip);
    stockPad.position.set(0, 0.035, 0.34);
    this.weaponGroup.add(stockPad);
    
    for (let i = 0; i < 5; i++) {
      const coolingSlotGeo = new THREE.BoxGeometry(0.02, 0.02, 0.005);
      const coolingSlot = new THREE.Mesh(coolingSlotGeo, materials.darkMetal);
      coolingSlot.position.set(0.03, 0.05, -0.05 + i * 0.015);
      this.weaponGroup.add(coolingSlot);
    }
    
    for (let i = 0; i < 5; i++) {
      const coolingSlotGeo = new THREE.BoxGeometry(0.02, 0.02, 0.005);
      const coolingSlot = new THREE.Mesh(coolingSlotGeo, materials.darkMetal);
      coolingSlot.position.set(-0.03, 0.05, -0.05 + i * 0.015);
      this.weaponGroup.add(coolingSlot);
    }
    
    const triggerGuardGeo = new THREE.BoxGeometry(0.045, 0.015, 0.07);
    const triggerGuard = new THREE.Mesh(triggerGuardGeo, materials.metal);
    triggerGuard.position.set(0, -0.0175, 0.12);
    this.weaponGroup.add(triggerGuard);
    
    const triggerGeo = new THREE.BoxGeometry(0.012, 0.025, 0.025);
    const trigger = new THREE.Mesh(triggerGeo, materials.darkMetal);
    trigger.position.set(0, -0.0075, 0.12);
    this.weaponGroup.add(trigger);
    
    const chargingHandleGeo = new THREE.BoxGeometry(0.015, 0.025, 0.02);
    const chargingHandle = new THREE.Mesh(chargingHandleGeo, materials.darkMetal);
    chargingHandle.position.set(-0.035, 0.085, 0.14);
    this.weaponGroup.add(chargingHandle);
    
    const safetyGeo = new THREE.BoxGeometry(0.008, 0.02, 0.015);
    const safety = new THREE.Mesh(safetyGeo, materials.darkMetal);
    safety.position.set(-0.029, 0.005, 0.15);
    this.weaponGroup.add(safety);
  }
  
  createMuzzleFlash() {
    const geometry = new THREE.SphereGeometry(0.15, 8, 6);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      transparent: true,
      opacity: 0
    });
    this.muzzleFlash = new THREE.Mesh(geometry, material);
    this.muzzleFlash.visible = false;
    this.scene.add(this.muzzleFlash);
  }
  
  shoot() {
    if (this.isReloading) return;
    if (this.currentAmmo <= 0) {
      this.reload();
      return;
    }
    
    const now = performance.now();
    if (now - this.lastShotTime < this.config.fireRate) return;
    
    this.lastShotTime = now;
    this.currentAmmo--;
    
    this.applyRecoil();
    this.showMuzzleFlash();
    this.createShellEjection();
    
    const pellets = this.config.pellets || 1;
    
    for (let i = 0; i < pellets; i++) {
      this.createBullet();
    }
    
    this.updateUI();
  }
  
  createShellEjection() {
    const shellGeo = new THREE.BoxGeometry(0.01, 0.01, 0.03);
    const shellMat = new THREE.MeshLambertMaterial({ 
      color: 0xffd700,
      flatShading: true
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    
    const shellPos = this.camera.position.clone();
    shellPos.add(right.clone().multiplyScalar(0.2));
    shellPos.y += 0.05;
    
    shell.position.copy(shellPos);
    this.scene.add(shell);
    
    shell.userData = {
      velocity: new THREE.Vector3(
        (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        Math.random() * 0.03 + 0.02,
        -Math.random() * 0.01 - 0.005
      ),
      rotationalSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      lifetime: 1500,
      createdAt: performance.now()
    };
    
    const animateShell = () => {
      if (!shell.parent) return;
      
      const now = performance.now();
      const elapsed = now - shell.userData.createdAt;
      
      if (elapsed >= shell.userData.lifetime) {
        this.scene.remove(shell);
        return;
      }
      
      shell.userData.velocity.y -= 0.001;
      shell.position.add(shell.userData.velocity);
      shell.rotation.x += shell.userData.rotationalSpeed.x;
      shell.rotation.y += shell.userData.rotationalSpeed.y;
      shell.rotation.z += shell.userData.rotationalSpeed.z;
      
      if (elapsed > 1000) {
        shell.material.opacity = 1 - ((elapsed - 1000) / 500);
        shell.material.transparent = true;
      }
      
      requestAnimationFrame(animateShell);
    };
    
    animateShell();
  }
  
  createBullet() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    const spread = this.config.spread;
    direction.x += (Math.random() - 0.5) * spread;
    direction.y += (Math.random() - 0.5) * spread;
    direction.z += (Math.random() - 0.5) * spread;
    direction.normalize();
    
    const bulletPosition = this.camera.position.clone();
    bulletPosition.add(direction.clone().multiplyScalar(1));
    
    const geometry = new THREE.SphereGeometry(0.03, 6, 4);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      emissive: 0xff6600
    });
    const bulletMesh = new THREE.Mesh(geometry, material);
    bulletMesh.position.copy(bulletPosition);
    this.scene.add(bulletMesh);
    
    const tailGeo = new THREE.CylinderGeometry(0.01, 0.02, 0.15, 6);
    tailGeo.rotateX(Math.PI / 2);
    const tailMat = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.7
    });
    const bulletTail = new THREE.Mesh(tailGeo, tailMat);
    bulletTail.position.copy(bulletPosition);
    bulletTail.lookAt(bulletPosition.clone().add(direction));
    this.scene.add(bulletTail);
    
    const bullet = {
      mesh: bulletMesh,
      tail: bulletTail,
      position: bulletPosition.clone(),
      direction: direction.clone(),
      speed: this.config.bulletSpeed,
      damage: this.config.damage,
      lifetime: this.config.bulletLifetime,
      createdAt: performance.now()
    };
    
    this.bullets.push(bullet);
  }
  
  applyRecoil() {
    this.recoilAmount = this.config.recoil;
    this.targetRecoilX = this.config.recoilX;
    this.targetRecoilY = this.config.recoilY;
  }
  
  showMuzzleFlash() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    const flashPosition = this.camera.position.clone();
    flashPosition.add(direction.clone().multiplyScalar(1.8));
    
    this.muzzleFlash.position.copy(flashPosition);
    this.muzzleFlash.visible = true;
    this.muzzleFlash.material.opacity = 1;
    this.muzzleFlash.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1 + Math.random() * 0.3);
    
    setTimeout(() => {
      if (this.muzzleFlash) {
        this.muzzleFlash.visible = false;
        this.muzzleFlash.material.opacity = 0;
      }
    }, 40);
  }
  
  reload() {
    if (this.isReloading) return;
    if (this.reserveAmmo <= 0) return;
    if (this.currentAmmo === this.config.maxAmmo) return;
    
    this.isReloading = true;
    
    const startReloadAnim = () => {
      if (!this.weaponGroup) return;
      const elapsed = performance.now() - reloadStartTime;
      const progress = Math.min(elapsed / 500, 1);
      
      this.weaponGroup.rotation.x = -0.3 * progress;
      this.weaponGroup.position.y = -0.2 - 0.1 * progress;
      
      if (progress < 1) {
        requestAnimationFrame(startReloadAnim);
      }
    };
    
    const endReloadAnim = () => {
      if (!this.weaponGroup) return;
      const elapsed = performance.now() - endAnimStartTime;
      const progress = Math.min(elapsed / 300, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      
      this.weaponGroup.rotation.x = -0.3 * (1 - easeProgress);
      this.weaponGroup.position.y = -0.3 + 0.1 * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(endReloadAnim);
      } else {
        this.weaponGroup.rotation.x = 0;
        this.weaponGroup.position.y = -0.2;
      }
    };
    
    const reloadStartTime = performance.now();
    startReloadAnim();
    
    setTimeout(() => {
      const ammoNeeded = this.config.maxAmmo - this.currentAmmo;
      const ammoToAdd = Math.min(ammoNeeded, this.reserveAmmo);
      
      this.currentAmmo += ammoToAdd;
      this.reserveAmmo -= ammoToAdd;
      this.isReloading = false;
      
      const endAnimStartTime = performance.now();
      endReloadAnim();
      
      this.updateUI();
    }, this.config.reloadTime);
  }
  
  handleInput() {
    const isRPressed = InputManager.isKeyPressed('KeyR');
    if (isRPressed && !this.wasRPressed) {
      this.reload();
    }
    this.wasRPressed = isRPressed;
    
    if (this.currentAmmo <= 0 && this.reserveAmmo > 0 && !this.isReloading && !this.autoReloadTriggered) {
      this.autoReloadTriggered = true;
      this.reload();
    }
    
    if (this.currentAmmo > 0) {
      this.autoReloadTriggered = false;
    }
    
    const shouldShoot = InputManager.isMouseLeftPressed() || 
                        InputManager.isKeyPressed('KeyF') || 
                        InputManager.isKeyPressed('Enter');
    
    if (shouldShoot) {
      this.shoot();
    }
  }
  
  update(deltaTime, enemies, walls = []) {
    this.handleInput();
    
    const hitEnemies = [];
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      const oldPosition = bullet.position.clone();
      
      bullet.position.add(
        bullet.direction.clone().multiplyScalar(bullet.speed * deltaTime)
      );
      bullet.mesh.position.copy(bullet.position);
      bullet.tail.position.copy(bullet.position);
      bullet.tail.lookAt(bullet.position.clone().add(bullet.direction));
      
      const hitWall = this.checkWallCollision(bullet, walls, oldPosition);
      if (hitWall) {
        this.createWallHitEffect(bullet.position);
        this.scene.remove(bullet.mesh);
        this.scene.remove(bullet.tail);
        this.bullets.splice(i, 1);
        continue;
      }
      
      let hitEnemy = false;
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        
        const hitRadius = enemy.config.size * 1.2;
        const hit = this.checkLineSphereIntersection(
          oldPosition,
          bullet.position,
          enemy.position,
          hitRadius
        );
        
        if (hit) {
          hitEnemies.push({
            enemy: enemy,
            damage: bullet.damage
          });
          
          this.createHitEffect(bullet.position);
          
          this.scene.remove(bullet.mesh);
          this.scene.remove(bullet.tail);
          this.bullets.splice(i, 1);
          hitEnemy = true;
          break;
        }
      }
      
      if (hitEnemy) continue;
      
      const now = performance.now();
      if (now - bullet.createdAt > bullet.lifetime) {
        this.scene.remove(bullet.mesh);
        this.scene.remove(bullet.tail);
        this.bullets.splice(i, 1);
      }
    }
    
    this.updateRecoil();
    
    return hitEnemies;
  }
  
  checkLineSphereIntersection(lineStart, lineEnd, sphereCenter, radius) {
    const lineDir = new THREE.Vector3().subVectors(lineEnd, lineStart);
    const lineLength = lineDir.length();
    
    if (lineLength === 0) {
      const dist = lineStart.distanceTo(sphereCenter);
      return dist < radius;
    }
    
    lineDir.normalize();
    
    const toSphere = new THREE.Vector3().subVectors(sphereCenter, lineStart);
    
    const projection = toSphere.dot(lineDir);
    
    let closestPoint;
    if (projection <= 0) {
      closestPoint = lineStart.clone();
    } else if (projection >= lineLength) {
      closestPoint = lineEnd.clone();
    } else {
      closestPoint = lineStart.clone().add(lineDir.clone().multiplyScalar(projection));
    }
    
    const distance = closestPoint.distanceTo(sphereCenter);
    
    return distance < radius;
  }
  
  checkWallCollision(bullet, walls, oldPosition) {
    const bulletPos = bullet.position;
    
    for (const wall of walls) {
      const wallBox = wall.userData.boundingBox;
      if (!wallBox) continue;
      
      const rayOrigin = oldPosition.clone();
      const rayDirection = bulletPos.clone().sub(oldPosition).normalize();
      const rayLength = oldPosition.distanceTo(bulletPos);
      
      const closestPoint = new THREE.Vector3();
      wallBox.clampPoint(bulletPos, closestPoint);
      
      const distanceToClosest = bulletPos.distanceTo(closestPoint);
      if (distanceToClosest < 0.05) {
        return true;
      }
      
      if (wallBox.containsPoint(bulletPos)) {
        return true;
      }
    }
    
    return false;
  }
  
  createWallHitEffect(position) {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x808080,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.08,
        Math.random() * 0.06,
        (Math.random() - 0.5) * 0.08
      );
      
      particle.userData = { velocity, lifetime: 300, createdAt: performance.now() };
      
      this.scene.add(particle);
      
      const animate = () => {
        if (!particle.parent) return;
        
        const now = performance.now();
        const elapsed = now - particle.userData.createdAt;
        
        if (elapsed >= particle.userData.lifetime) {
          this.scene.remove(particle);
          return;
        }
        
        particle.userData.velocity.y -= 0.002;
        particle.position.add(particle.userData.velocity);
        particle.material.opacity = 1 - (elapsed / particle.userData.lifetime);
        
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  }
  
  updateRecoil() {
    if (this.recoilAmount > 0) {
      this.recoilAmount *= 0.85;
      if (this.recoilAmount < 0.001) {
        this.recoilAmount = 0;
      }
    }
    
    if (this.weaponGroup) {
      this.weaponGroup.rotation.x = this.recoilAmount * 0.8;
      this.weaponGroup.position.z = -0.5 + this.recoilAmount * 2;
    }
  }
  
  getRecoilX() {
    return this.targetRecoilX;
  }
  
  getRecoilY() {
    return this.targetRecoilY;
  }
  
  clearTargetRecoil() {
    this.targetRecoilX = 0;
    this.targetRecoilY = 0;
  }
  
  createHitEffect(position) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.BoxGeometry(0.025, 0.025, 0.025);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.08,
        (Math.random() - 0.5) * 0.1
      );
      
      particle.userData = { velocity, lifetime: 250, createdAt: performance.now() };
      
      this.scene.add(particle);
      
      const animate = () => {
        if (!particle.parent) return;
        
        const now = performance.now();
        const elapsed = now - particle.userData.createdAt;
        
        if (elapsed >= particle.userData.lifetime) {
          this.scene.remove(particle);
          return;
        }
        
        particle.userData.velocity.y -= 0.002;
        particle.position.add(particle.userData.velocity);
        particle.material.opacity = 1 - (elapsed / particle.userData.lifetime);
        
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  }
  
  updateUI() {
    const ammoDisplay = document.getElementById('ammo-display');
    const status = this.isReloading ? ' (换弹中...)' : '';
    ammoDisplay.textContent = `弹药: ${this.currentAmmo} / ${this.reserveAmmo}${status}`;
  }
  
  reset() {
    this.currentAmmo = this.config.maxAmmo;
    this.reserveAmmo = this.config.reserveAmmo;
    this.isReloading = false;
    this.recoilAmount = 0;
    
    for (const bullet of this.bullets) {
      this.scene.remove(bullet.mesh);
      this.scene.remove(bullet.tail);
    }
    this.bullets = [];
    
    if (this.weaponGroup) {
      this.camera.remove(this.weaponGroup);
      this.weaponGroup = null;
    }
    
    if (this.muzzleFlash) {
      this.scene.remove(this.muzzleFlash);
      this.muzzleFlash = null;
    }
    
    this.updateUI();
  }
  
  getRecoil() {
    return this.recoilAmount;
  }
}
