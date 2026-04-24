import * as THREE from 'three';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

export function hash(x, y, seed = 0) {
  let h = seed ^ (x * 374761393 + y * 668265263);
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

export function vec3ToString(vec) {
  return `${Math.floor(vec.x)},${Math.floor(vec.y)},${Math.floor(vec.z)}`;
}

export function chunkKeyToCoords(key) {
  const [x, z] = key.split(',').map(Number);
  return { x, z };
}

export function worldToChunk(pos) {
  return {
    x: Math.floor(pos.x / 16),
    z: Math.floor(pos.z / 16),
  };
}

export function worldToLocal(pos) {
  return {
    x: Math.floor(pos.x) & 15,
    y: Math.floor(pos.y),
    z: Math.floor(pos.z) & 15,
  };
}

export function localToWorld(chunkX, chunkZ, localX, localY, localZ) {
  return new THREE.Vector3(
    chunkX * 16 + localX,
    localY,
    chunkZ * 16 + localZ
  );
}

export function getNeighborDirections() {
  return [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
}

export function getHorizontalDirections() {
  return [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
}

export function raycastBlock(world, origin, direction, maxDistance) {
  const step = 0.05;
  const checkPos = origin.clone();
  const lastPos = origin.clone();
  const stepVec = direction.clone().multiplyScalar(step);
  
  for (let i = 0; i < maxDistance / step; i++) {
    checkPos.add(stepVec);
    
    const blockX = Math.floor(checkPos.x);
    const blockY = Math.floor(checkPos.y);
    const blockZ = Math.floor(checkPos.z);
    
    const block = world.getBlock(blockX, blockY, blockZ);
    if (block && block.solid) {
      const faceNormal = new THREE.Vector3();
      
      if (Math.floor(lastPos.x) !== blockX) {
        faceNormal.set(blockX > lastPos.x ? -1 : 1, 0, 0);
      } else if (Math.floor(lastPos.y) !== blockY) {
        faceNormal.set(0, blockY > lastPos.y ? -1 : 1, 0);
      } else if (Math.floor(lastPos.z) !== blockZ) {
        faceNormal.set(0, 0, blockZ > lastPos.z ? -1 : 1);
      }
      
      return {
        hit: true,
        blockPos: new THREE.Vector3(blockX, blockY, blockZ),
        faceNormal,
        distance: i * step,
      };
    }
    
    lastPos.copy(checkPos);
  }
  
  return { hit: false };
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export class PriorityQueue {
  constructor() {
    this.items = [];
  }
  
  enqueue(element, priority) {
    const queueElement = { element, priority };
    let added = false;
    
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }
    
    if (!added) {
      this.items.push(queueElement);
    }
  }
  
  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift().element;
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
  
  size() {
    return this.items.length;
  }
  
  clear() {
    this.items = [];
  }
}
