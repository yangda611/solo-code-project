import * as THREE from 'three';
import {
  GRAVITY,
  JUMP_VELOCITY,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_EYE_HEIGHT,
  MOVE_SPEED,
  SPRINT_SPEED,
  SNEAK_SPEED,
  REACH_DISTANCE,
  BLOCK_BREAK_TIME,
  BLOCK_AIR,
  BLOCK_TYPES,
  BLOCK_BEDROCK,
  HOTBAR_SIZE,
} from '../utils/Constants.js';
import { raycastBlock } from '../utils/Utils.js';

export class PlayerController {
  constructor(camera, world, domElement) {
    this.camera = camera;
    this.world = world;
    this.domElement = domElement;
    
    this.position = new THREE.Vector3(0, 100, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = { x: 0, y: 0 };
    
    this.onGround = false;
    this.isSprinting = false;
    this.isSneaking = false;
    
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;
    
    this.isPointerLocked = false;
    this.isBreakingBlock = false;
    this.breakProgress = 0;
    this.currentBreakingBlock = null;
    
    this.hotbar = new Array(HOTBAR_SIZE).fill(null).map(() => ({ item: null, count: 0 }));
    this.selectedHotbarSlot = 0;
    
    this.lastSelectedBlock = null;
    
    this.initControls();
  }
  
  initControls() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.domElement.requestPointerLock();
      }
    });
    
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.onMouseMove(e);
      }
    });
    
    document.addEventListener('mousedown', (e) => {
      if (this.isPointerLocked) {
        this.onMouseDown(e);
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      this.onMouseUp(e);
    });
    
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    this.initHotbar();
  }
  
  initHotbar() {
    this.hotbar[0] = { item: { id: 'pickaxe_wood', name: '木镐', type: 'tool', durability: 60, maxDurability: 60 }, count: 1 };
    this.hotbar[1] = { item: { id: 'shovel_wood', name: '木铲', type: 'tool', durability: 60, maxDurability: 60 }, count: 1 };
    this.hotbar[2] = { item: { id: 'axe_wood', name: '木斧', type: 'tool', durability: 60, maxDurability: 60 }, count: 1 };
    this.hotbar[3] = { item: { id: 'block_dirt', name: '泥土', type: 'block', blockId: 2 }, count: 64 };
    this.hotbar[4] = { item: { id: 'block_cobblestone', name: '圆石', type: 'block', blockId: 15 }, count: 64 };
    this.hotbar[5] = { item: { id: 'block_wood', name: '木头', type: 'block', blockId: 8 }, count: 64 };
    this.hotbar[6] = { item: { id: 'block_planks', name: '木板', type: 'block', blockId: 16 }, count: 64 };
    this.hotbar[7] = { item: { id: 'block_sand', name: '沙子', type: 'block', blockId: 4 }, count: 64 };
    this.hotbar[8] = { item: { id: 'torch', name: '火把', type: 'block', blockId: 24 }, count: 64 };
    
    this.updateHotbarUI();
  }
  
  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'Space': this.jump = true; break;
      case 'ShiftLeft': this.isSneaking = true; break;
      case 'ControlLeft': this.isSprinting = true; break;
      case 'Digit1': this.selectHotbarSlot(0); break;
      case 'Digit2': this.selectHotbarSlot(1); break;
      case 'Digit3': this.selectHotbarSlot(2); break;
      case 'Digit4': this.selectHotbarSlot(3); break;
      case 'Digit5': this.selectHotbarSlot(4); break;
      case 'Digit6': this.selectHotbarSlot(5); break;
      case 'Digit7': this.selectHotbarSlot(6); break;
      case 'Digit8': this.selectHotbarSlot(7); break;
      case 'Digit9': this.selectHotbarSlot(8); break;
    }
  }
  
  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
      case 'Space': this.jump = false; break;
      case 'ShiftLeft': this.isSneaking = false; break;
      case 'ControlLeft': this.isSprinting = false; break;
    }
  }
  
  onMouseMove(e) {
    const sensitivity = 0.002;
    
    this.rotation.x -= e.movementY * sensitivity;
    this.rotation.y -= e.movementX * sensitivity;
    
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    
    while (this.rotation.y < 0) this.rotation.y += Math.PI * 2;
    while (this.rotation.y >= Math.PI * 2) this.rotation.y -= Math.PI * 2;
  }
  
  onMouseDown(e) {
    if (e.button === 0) {
      const rayResult = this.raycast();
      if (rayResult.hit) {
        const block = this.world.getBlock(
          rayResult.blockPos.x,
          rayResult.blockPos.y,
          rayResult.blockPos.z
        );
        
        if (block && block.id !== BLOCK_AIR && !block.unbreakable) {
          this.isBreakingBlock = true;
          this.currentBreakingBlock = rayResult.blockPos.clone();
          this.breakProgress = 0;
        }
      }
    } else if (e.button === 2) {
      this.placeBlock();
    }
  }
  
  onMouseUp(e) {
    if (e.button === 0) {
      this.isBreakingBlock = false;
      this.breakProgress = 0;
      this.currentBreakingBlock = null;
    }
  }
  
  selectHotbarSlot(index) {
    this.selectedHotbarSlot = index;
    this.updateHotbarUI();
  }
  
  updateHotbarUI() {
    const hotbarElement = document.getElementById('hotbar');
    hotbarElement.innerHTML = '';
    
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = document.createElement('div');
      slot.className = `hotbar-slot ${i === this.selectedHotbarSlot ? 'selected' : ''}`;
      
      const keyLabel = document.createElement('span');
      keyLabel.className = 'slot-key';
      keyLabel.textContent = i + 1;
      slot.appendChild(keyLabel);
      
      const hotbarItem = this.hotbar[i];
      if (hotbarItem && hotbarItem.item && hotbarItem.count > 0) {
        const countLabel = document.createElement('span');
        countLabel.className = 'slot-count';
        countLabel.textContent = hotbarItem.count;
        slot.appendChild(countLabel);
        
        slot.style.background = this.getItemColor(hotbarItem.item);
      }
      
      slot.addEventListener('click', () => this.selectHotbarSlot(i));
      hotbarElement.appendChild(slot);
    }
  }
  
  getItemColor(item) {
    if (item.type === 'block') {
      const blockType = BLOCK_TYPES[item.blockId];
      if (blockType) {
        const r = (blockType.color >> 16) & 0xFF;
        const g = (blockType.color >> 8) & 0xFF;
        const b = blockType.color & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
    return 'rgba(139, 139, 139, 0.5)';
  }
  
  raycast() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    
    const eyePos = this.position.clone();
    eyePos.y += PLAYER_EYE_HEIGHT;
    
    return raycastBlock(this.world, eyePos, direction, REACH_DISTANCE);
  }
  
  breakBlock() {
    if (!this.currentBreakingBlock) return;
    
    const block = this.world.getBlock(
      this.currentBreakingBlock.x,
      this.currentBreakingBlock.y,
      this.currentBreakingBlock.z
    );
    
    if (!block || block.id === BLOCK_AIR || block.unbreakable) {
      this.isBreakingBlock = false;
      return;
    }
    
    this.world.setBlock(
      this.currentBreakingBlock.x,
      this.currentBreakingBlock.y,
      this.currentBreakingBlock.z,
      BLOCK_AIR
    );
    
    this.isBreakingBlock = false;
    this.breakProgress = 0;
  }
  
  placeBlock() {
    const rayResult = this.raycast();
    if (!rayResult.hit) return;
    
    const hotbarItem = this.hotbar[this.selectedHotbarSlot];
    if (!hotbarItem || !hotbarItem.item || hotbarItem.count <= 0) return;
    
    if (hotbarItem.item.type !== 'block') return;
    
    const placePos = rayResult.blockPos.clone().add(rayResult.faceNormal);
    
    const playerMinX = this.position.x - PLAYER_WIDTH / 2;
    const playerMaxX = this.position.x + PLAYER_WIDTH / 2;
    const playerMinY = this.position.y;
    const playerMaxY = this.position.y + PLAYER_HEIGHT;
    const playerMinZ = this.position.z - PLAYER_WIDTH / 2;
    const playerMaxZ = this.position.z + PLAYER_WIDTH / 2;
    
    const blockMinX = placePos.x;
    const blockMaxX = placePos.x + 1;
    const blockMinY = placePos.y;
    const blockMaxY = placePos.y + 1;
    const blockMinZ = placePos.z;
    const blockMaxZ = placePos.z + 1;
    
    const overlapX = blockMinX < playerMaxX && blockMaxX > playerMinX;
    const overlapY = blockMinY < playerMaxY && blockMaxY > playerMinY;
    const overlapZ = blockMinZ < playerMaxZ && blockMaxZ > playerMinZ;
    
    if (overlapX && overlapY && overlapZ) {
      return;
    }
    
    this.world.setBlock(
      placePos.x,
      placePos.y,
      placePos.z,
      hotbarItem.item.blockId
    );
    
    hotbarItem.count--;
    if (hotbarItem.count <= 0) {
      hotbarItem.item = null;
      hotbarItem.count = 0;
    }
    
    this.updateHotbarUI();
  }
  
  update(deltaTime) {
    if (!this.isPointerLocked) return;
    
    if (this.isBreakingBlock && this.currentBreakingBlock) {
      this.breakProgress += deltaTime / BLOCK_BREAK_TIME;
      
      if (this.breakProgress >= 1) {
        this.breakBlock();
      }
    }
    
    const cameraPos = this.position.clone();
    cameraPos.y += PLAYER_EYE_HEIGHT;
    this.camera.position.copy(cameraPos);
    
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.x = this.rotation.x;
    this.camera.rotation.y = this.rotation.y;
    
    const moveDir = new THREE.Vector3();
    
    if (this.moveForward) moveDir.z -= 1;
    if (this.moveBackward) moveDir.z += 1;
    if (this.moveLeft) moveDir.x -= 1;
    if (this.moveRight) moveDir.x += 1;
    
    if (moveDir.length() > 0) {
      moveDir.normalize();
      
      const yaw = this.rotation.y;
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      
      let speed = MOVE_SPEED;
      if (this.isSprinting && this.onGround) speed = SPRINT_SPEED;
      if (this.isSneaking) speed = SNEAK_SPEED;
      
      this.velocity.x = (moveDir.x * cosYaw - moveDir.z * sinYaw) * speed;
      this.velocity.z = (moveDir.x * sinYaw + moveDir.z * cosYaw) * speed;
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
      
      if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.1) this.velocity.z = 0;
    }
    
    if (this.jump && this.onGround) {
      this.velocity.y = JUMP_VELOCITY;
      this.onGround = false;
    }
    
    this.velocity.y -= GRAVITY * deltaTime;
    
    this.moveWithCollision(deltaTime);
  }
  
  moveWithCollision(deltaTime) {
    const halfWidth = PLAYER_WIDTH / 2;
    const height = PLAYER_HEIGHT;
    
    const stepX = this.velocity.x * deltaTime;
    const stepY = this.velocity.y * deltaTime;
    const stepZ = this.velocity.z * deltaTime;
    
    this.onGround = false;
    
    this.moveYWithCollision(stepY, halfWidth, height);
    
    this.moveXWithCollision(stepX, halfWidth, height);
    
    this.moveZWithCollision(stepZ, halfWidth, height);
  }
  
  moveYWithCollision(stepY, halfWidth, height) {
    const newY = this.position.y + stepY;
    
    if (stepY < 0) {
      const groundY = this.findGroundY(this.position.x, this.position.y, newY, this.position.z, halfWidth, height);
      if (groundY !== null) {
        this.position.y = groundY;
        this.velocity.y = 0;
        this.onGround = true;
      } else {
        this.position.y = newY;
      }
    } else {
      const collisionY = this.checkCollisionYUp(this.position.x, this.position.y, newY, this.position.z, halfWidth, height);
      if (collisionY !== null) {
        this.position.y = collisionY;
        this.velocity.y = 0;
      } else {
        this.position.y = newY;
      }
    }
  }
  
  moveXWithCollision(stepX, halfWidth, height) {
    if (Math.abs(stepX) < 0.0001) return;
    
    const newX = this.position.x + stepX;
    
    const collisionX = this.checkCollisionAxis(
      this.position.x, newX,
      this.position.y, this.position.z,
      halfWidth, height,
      'x'
    );
    
    if (collisionX !== null) {
      this.position.x = collisionX;
      this.velocity.x = 0;
    } else {
      this.position.x = newX;
    }
  }
  
  moveZWithCollision(stepZ, halfWidth, height) {
    if (Math.abs(stepZ) < 0.0001) return;
    
    const newZ = this.position.z + stepZ;
    
    const collisionZ = this.checkCollisionAxis(
      this.position.z, newZ,
      this.position.y, this.position.x,
      halfWidth, height,
      'z'
    );
    
    if (collisionZ !== null) {
      this.position.z = collisionZ;
      this.velocity.z = 0;
    } else {
      this.position.z = newZ;
    }
  }
  
  checkCollisionAxis(currentPos, newPos, playerY, otherAxisPos, halfWidth, height, axis) {
    const direction = newPos > currentPos ? 1 : -1;
    const playerMin = Math.min(currentPos, newPos) - halfWidth;
    const playerMax = Math.max(currentPos, newPos) + halfWidth;
    
    const minY = playerY;
    const maxY = playerY + height;
    
    const startBlock = Math.floor(playerMin);
    const endBlock = Math.floor(playerMax - 0.0001);
    
    let nearestCollision = null;
    
    for (let block = startBlock; block <= endBlock; block++) {
      const blockMin = block;
      const blockMax = block + 1;
      
      const overlapMin = Math.max(playerMin, blockMin);
      const overlapMax = Math.min(playerMax, blockMax);
      
      if (overlapMax <= overlapMin) continue;
      
      for (let by = Math.floor(minY); by <= Math.floor(maxY - 0.0001); by++) {
        const blockYMin = by;
        const blockYMax = by + 1;
        
        if (blockYMax <= minY || blockYMin >= maxY) continue;
        
        let hasCollision = false;
        
        if (axis === 'x') {
          for (let bz = Math.floor(otherAxisPos - halfWidth); bz <= Math.floor(otherAxisPos + halfWidth - 0.0001); bz++) {
            const blockZMin = bz;
            const blockZMax = bz + 1;
            
            if (blockZMax <= otherAxisPos - halfWidth || blockZMin >= otherAxisPos + halfWidth) continue;
            
            const blockData = this.world.getBlock(block, by, bz);
            
            if (blockData && blockData.solid) {
              hasCollision = true;
              break;
            }
          }
        } else {
          for (let bx = Math.floor(otherAxisPos - halfWidth); bx <= Math.floor(otherAxisPos + halfWidth - 0.0001); bx++) {
            const blockXMin = bx;
            const blockXMax = bx + 1;
            
            if (blockXMax <= otherAxisPos - halfWidth || blockXMin >= otherAxisPos + halfWidth) continue;
            
            const blockData = this.world.getBlock(bx, by, block);
            
            if (blockData && blockData.solid) {
              hasCollision = true;
              break;
            }
          }
        }
        
        if (hasCollision) {
          let collisionPos;
          if (direction > 0) {
            collisionPos = blockMin - halfWidth;
          } else {
            collisionPos = blockMax + halfWidth;
          }
          
          if (nearestCollision === null) {
            nearestCollision = collisionPos;
          } else {
            if (direction > 0) {
              nearestCollision = Math.min(nearestCollision, collisionPos);
            } else {
              nearestCollision = Math.max(nearestCollision, collisionPos);
            }
          }
          break;
        }
      }
    }
    
    return nearestCollision;
  }
  
  findGroundY(x, currentY, newY, z, halfWidth, height) {
    const minX = x - halfWidth;
    const maxX = x + halfWidth;
    const minZ = z - halfWidth;
    const maxZ = z + halfWidth;
    
    const startBy = Math.floor(Math.min(currentY, newY) - 1);
    const endBy = Math.floor(Math.max(currentY, newY) + height);
    
    let highestGround = null;
    
    for (let bx = Math.floor(minX); bx <= Math.floor(maxX - 0.0001); bx++) {
      for (let bz = Math.floor(minZ); bz <= Math.floor(maxZ - 0.0001); bz++) {
        const blockXMin = bx;
        const blockXMax = bx + 1;
        const blockZMin = bz;
        const blockZMax = bz + 1;
        
        if (blockXMax <= minX || blockXMin >= maxX) continue;
        if (blockZMax <= minZ || blockZMin >= maxZ) continue;
        
        for (let by = startBy; by <= endBy; by++) {
          const block = this.world.getBlock(bx, by, bz);
          if (block && block.solid) {
            const blockTop = by + 1;
            
            if (blockTop >= newY && by < currentY + height) {
              if (highestGround === null || blockTop > highestGround) {
                highestGround = blockTop;
              }
            }
          }
        }
      }
    }
    
    return highestGround;
  }
  
  checkCollisionYUp(x, currentY, newY, z, halfWidth, height) {
    const minX = x - halfWidth;
    const maxX = x + halfWidth;
    const minZ = z - halfWidth;
    const maxZ = z + halfWidth;
    
    const startBy = Math.floor(currentY);
    const endBy = Math.floor(newY + height);
    
    let lowestCollision = null;
    
    for (let bx = Math.floor(minX); bx <= Math.floor(maxX - 0.0001); bx++) {
      for (let bz = Math.floor(minZ); bz <= Math.floor(maxZ - 0.0001); bz++) {
        const blockXMin = bx;
        const blockXMax = bx + 1;
        const blockZMin = bz;
        const blockZMax = bz + 1;
        
        if (blockXMax <= minX || blockXMin >= maxX) continue;
        if (blockZMax <= minZ || blockZMin >= maxZ) continue;
        
        for (let by = startBy; by <= endBy; by++) {
          const block = this.world.getBlock(bx, by, bz);
          if (block && block.solid) {
            const blockBottom = by;
            
            if (blockBottom < newY + height && blockBottom >= currentY) {
              const collisionY = blockBottom - height;
              if (lowestCollision === null || collisionY < lowestCollision) {
                lowestCollision = collisionY;
              }
            }
          }
        }
      }
    }
    
    return lowestCollision;
  }
}
