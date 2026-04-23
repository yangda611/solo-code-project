import * as THREE from 'three';
import { CONFIG } from './config.js';
import { InputManager } from './input.js';

export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    
    this.position = new THREE.Vector3(0, CONFIG.PLAYER.height, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = { x: 0, y: 0 };
    
    this.health = CONFIG.PLAYER.maxHealth;
    this.maxHealth = CONFIG.PLAYER.maxHealth;
    
    this.isGrounded = true;
    
    this.pointerLockAvailable = false;
    this.isPointerLocked = false;
    
    this.init();
  }
  
  init() {
    this.checkPointerLockSupport();
    this.setupControls();
    this.createCollisionMesh();
  }
  
  checkPointerLockSupport() {
    this.pointerLockAvailable = 'pointerLockElement' in document ||
                                 'mozPointerLockElement' in document ||
                                 'webkitPointerLockElement' in document;
  }
  
  setupControls() {
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    if (this.pointerLockAvailable) {
      const container = document.getElementById('game-container');
      document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
      document.addEventListener('mozpointerlockchange', () => this.onPointerLockChange());
      document.addEventListener('webkitpointerlockchange', () => this.onPointerLockChange());
    }
  }
  
  onMouseMove(e) {
    if (!this.isPointerLocked) return;
    
    const sensitivity = 0.002;
    
    this.rotation.y -= e.movementX * sensitivity;
    this.rotation.x -= e.movementY * sensitivity;
    
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
  }
  
  updateLookFromKeyboard(deltaTime) {
    const lookSpeed = 2.0 * deltaTime;
    
    if (InputManager.isKeyPressed('ArrowLeft')) {
      this.rotation.y += lookSpeed;
    }
    if (InputManager.isKeyPressed('ArrowRight')) {
      this.rotation.y -= lookSpeed;
    }
    if (InputManager.isKeyPressed('ArrowUp')) {
      this.rotation.x = Math.max(-Math.PI / 2, this.rotation.x - lookSpeed);
    }
    if (InputManager.isKeyPressed('ArrowDown')) {
      this.rotation.x = Math.min(Math.PI / 2, this.rotation.x + lookSpeed);
    }
  }
  
  lockPointer() {
    if (!this.pointerLockAvailable) return;
    
    const container = document.getElementById('game-container');
    try {
      if (container.requestPointerLock) {
        container.requestPointerLock();
      } else if (container.mozRequestPointerLock) {
        container.mozRequestPointerLock();
      } else if (container.webkitRequestPointerLock) {
        container.webkitRequestPointerLock();
      }
    } catch (e) {
      console.log('Pointer lock not available in this environment');
    }
  }
  
  unlockPointer() {
    try {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      } else if (document.mozExitPointerLock) {
        document.mozExitPointerLock();
      } else if (document.webkitExitPointerLock) {
        document.webkitExitPointerLock();
      }
    } catch (e) {
      console.log('Cannot exit pointer lock');
    }
  }
  
  onPointerLockChange() {
    this.isPointerLocked = !!(document.pointerLockElement || 
                                document.mozPointerLockElement || 
                                document.webkitPointerLockElement);
  }
  
  createCollisionMesh() {
    const geometry = new THREE.SphereGeometry(CONFIG.PLAYER.radius, 8, 6);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    this.collisionMesh = new THREE.Mesh(geometry, material);
    this.collisionMesh.position.copy(this.position);
    this.scene.add(this.collisionMesh);
  }
  
  update(deltaTime, walls = []) {
    this.updateLookFromKeyboard(deltaTime);
    
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    direction.set(
      Math.sin(this.rotation.y),
      0,
      Math.cos(this.rotation.y)
    );
    
    right.set(
      Math.cos(this.rotation.y),
      0,
      -Math.sin(this.rotation.y)
    );
    
    const isSprinting = InputManager.isKeyPressed('ShiftLeft') || InputManager.isKeyPressed('ShiftRight');
    let speed = CONFIG.PLAYER.speed;
    if (isSprinting) {
      speed *= CONFIG.PLAYER.sprintMultiplier;
    }
    
    const moveVector = new THREE.Vector3(0, 0, 0);
    
    if (InputManager.isKeyPressed('KeyW')) {
      moveVector.add(direction);
    }
    if (InputManager.isKeyPressed('KeyS')) {
      moveVector.sub(direction);
    }
    if (InputManager.isKeyPressed('KeyA')) {
      moveVector.sub(right);
    }
    if (InputManager.isKeyPressed('KeyD')) {
      moveVector.add(right);
    }
    
    if (InputManager.isKeyPressed('Space') && this.isGrounded) {
      this.velocity.y = CONFIG.PLAYER.jumpForce;
      this.isGrounded = false;
    }
    
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(speed * deltaTime * 60);
    }
    
    const newPosition = this.position.clone();
    newPosition.x += moveVector.x;
    newPosition.z += moveVector.z;
    
    if (!this.checkWallCollision(newPosition, walls)) {
      this.position.x = newPosition.x;
      this.position.z = newPosition.z;
    }
    
    this.velocity.y -= CONFIG.PLAYER.gravity * deltaTime * 60;
    this.position.y += this.velocity.y * deltaTime * 60;
    
    if (this.position.y <= CONFIG.PLAYER.height) {
      this.position.y = CONFIG.PLAYER.height;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
    
    this.collisionMesh.position.copy(this.position);
    
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.rotation.y;
    this.camera.rotation.x = this.rotation.x;
  }
  
  checkWallCollision(newPosition, walls) {
    const playerRadius = CONFIG.PLAYER.radius;
    
    for (const wall of walls) {
      const wallBox = wall.userData.boundingBox;
      if (!wallBox) continue;
      
      const closestPoint = new THREE.Vector3();
      wallBox.clampPoint(newPosition, closestPoint);
      
      const distance = newPosition.distanceTo(closestPoint);
      
      if (distance < playerRadius) {
        return true;
      }
    }
    
    return false;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.health = Math.max(0, this.health);
    
    this.showDamageEffect();
    
    return this.health <= 0;
  }
  
  showDamageEffect() {
    const overlay = document.getElementById('damage-overlay');
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
    }, 100);
  }
  
  heal(amount) {
    this.health += amount;
    this.health = Math.min(this.maxHealth, this.health);
  }
  
  reset() {
    this.position.set(0, CONFIG.PLAYER.height, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.x = 0;
    this.rotation.y = 0;
    this.health = this.maxHealth;
    this.isGrounded = true;
  }
  
  getForwardDirection() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }
  
  getPosition() {
    return this.position.clone();
  }
}
