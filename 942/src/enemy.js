import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Enemy {
  constructor(type, position, scene) {
    this.type = type;
    this.config = CONFIG.ENEMY[type];
    this.scene = scene;
    
    this.position = position.clone();
    this.position.y = this.config.size * 0.75;
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    
    this.isDead = false;
    this.lastAttackTime = 0;
    
    this.mesh = null;
    this.init();
  }
  
  init() {
    this.createMesh();
  }
  
  createMesh() {
    const size = this.config.size;
    
    const bodyGeometry = new THREE.BoxGeometry(size, size * 1.5, size);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: this.config.color,
      flatShading: true
    });
    
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = size * 0.75;
    
    const eyeGeometry = new THREE.SphereGeometry(size * 0.1, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-size * 0.2, size * 0.3, -size * 0.45);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(size * 0.2, size * 0.3, -size * 0.45);
    this.mesh.add(rightEye);
    
    this.scene.add(this.mesh);
    
    this.mesh.userData = {
      boundingBox: new THREE.Box3().setFromObject(this.mesh)
    };
  }
  
  update(deltaTime, playerPosition) {
    if (this.isDead) return;
    
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    
    direction.y = 0;
    
    const adjustedSpeed = this.config.speed * CONFIG.GAME.enemySpeedMultiplier;
    this.position.add(direction.multiplyScalar(adjustedSpeed * deltaTime * 60));
    this.mesh.position.copy(this.position);
    this.mesh.position.y = this.config.size * 0.75;
    
    this.position.y = this.config.size * 0.75;
    
    this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
    
    this.mesh.userData.boundingBox.setFromObject(this.mesh);
    
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    return this.checkAttack(distanceToPlayer);
  }
  
  checkAttack(distanceToPlayer) {
    const now = performance.now();
    
    if (distanceToPlayer <= this.config.attackRange) {
      if (now - this.lastAttackTime >= this.config.attackCooldown) {
        this.lastAttackTime = now;
        return { shouldAttack: true, damage: this.config.damage };
      }
    }
    
    return { shouldAttack: false, damage: 0 };
  }
  
  takeDamage(damage) {
    if (this.isDead) return false;
    
    this.health -= damage;
    this.flashRed();
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }
  
  flashRed() {
    const originalColor = this.mesh.material.color.getHex();
    this.mesh.material.color.setHex(0xff6666);
    
    setTimeout(() => {
      if (this.mesh) {
        this.mesh.material.color.setHex(originalColor);
      }
    }, 100);
  }
  
  die() {
    this.isDead = true;
    
    this.createDeathEffect();
    
    setTimeout(() => {
      this.scene.remove(this.mesh);
      this.mesh = null;
    }, 300);
  }
  
  createDeathEffect() {
    const particleCount = 8;
    const size = this.config.size;
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.BoxGeometry(size * 0.2, size * 0.2, size * 0.2);
      const material = new THREE.MeshBasicMaterial({ 
        color: this.config.color,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(this.position);
      particle.position.y = size * 0.5;
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      
      particle.userData = { velocity, lifetime: 500, createdAt: performance.now() };
      
      this.scene.add(particle);
      
      this.animateDeathParticle(particle);
    }
  }
  
  animateDeathParticle(particle) {
    const update = () => {
      if (!particle.parent) return;
      
      const now = performance.now();
      const elapsed = now - particle.userData.createdAt;
      
      if (elapsed >= particle.userData.lifetime) {
        this.scene.remove(particle);
        return;
      }
      
      particle.position.add(particle.userData.velocity);
      particle.userData.velocity.y -= 0.02;
      particle.material.opacity = 1 - (elapsed / particle.userData.lifetime);
      
      requestAnimationFrame(update);
    };
    
    update();
  }
  
  reset() {
    this.health = this.maxHealth;
    this.isDead = false;
    this.lastAttackTime = 0;
  }
}
