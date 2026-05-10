import { Vector3, Color3, Animation, Vector4, DynamicTexture, VertexBuffer, Mesh } from '@babylonjs/core';
import { meshUtils } from './meshUtils';

let activeAnimations = new Map();

const lerp = (a, b, t) => a + (b - a) * t;

const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

const easeInExpo = (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10);

export const createAnimations = {
  async animateSubdivisionGrowth(mesh, fromLevel, toLevel, scene, loadMesh) {
    return new Promise((resolve) => {
      const fromData = meshUtils.extractMeshData(mesh);
      const toData = { vertices: toLevel.vertices, faces: toLevel.faces };
      
      const duration = 800;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutQuad(progress);
        
        if (fromData.vertices.length === toData.vertices.length) {
          const lerpedVerts = meshUtils.lerpVertices(
            fromData.vertices,
            toData.vertices,
            eased
          );
          meshUtils.updateMeshPositions(mesh, lerpedVerts);
        } else {
          if (progress > 0.5) {
            const newMesh = loadMesh(toLevel);
            if (newMesh) {
              newMesh.visibility = 0;
              animateFadeIn(newMesh, scene);
            }
            resolve();
            return;
          }
        }
        
        if (mesh.material) {
          const color = Color3.Lerp(
            new Color3(0.4, 0.5, 0.6),
            new Color3(0.7, 0.8, 0.9),
            eased
          );
          mesh.material.emissiveColor = new Color3(
            0.1 * (1 - eased),
            0.2 * (1 - eased),
            0.3 * (1 - eased)
          );
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  },

  async animateMorphTo(mesh, targetData, scene) {
    return new Promise((resolve) => {
      if (!mesh) {
        resolve();
        return;
      }
      
      const fromData = meshUtils.extractMeshData(mesh);
      const toData = targetData;
      
      const duration = 600;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutQuad(progress);
        
        const minVerts = Math.min(fromData.vertices.length, toData.vertices.length);
        const lerpedVerts = [];
        
        for (let i = 0; i < minVerts; i++) {
          lerpedVerts.push([
            lerp(fromData.vertices[i][0], toData.vertices[i][0], eased),
            lerp(fromData.vertices[i][1], toData.vertices[i][1], eased),
            lerp(fromData.vertices[i][2], toData.vertices[i][2], eased)
          ]);
        }
        
        for (let i = minVerts; i < fromData.vertices.length; i++) {
          lerpedVerts.push([
            lerp(fromData.vertices[i][0], 0, eased),
            lerp(fromData.vertices[i][1], 0, eased),
            lerp(fromData.vertices[i][2], 0, eased)
          ]);
        }
        
        if (mesh) {
          meshUtils.updateMeshPositions(mesh, lerpedVerts.slice(0, fromData.vertices.length));
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  },

  animateFadeIn(mesh, scene) {
    if (!mesh) return;
    
    mesh.visibility = 0;
    const duration = 400;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      
      mesh.visibility = eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },

  startNormalPulseAnimation(mesh, scene) {
    if (!mesh) return;
    
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
    
    if (!normals) return;
    
    const originalPositions = [...positions];
    let time = 0;
    
    const animId = 'normal-pulse-' + mesh.id;
    
    const animate = () => {
      if (!activeAnimations.has(animId)) return;
      
      time += 0.03;
      const newPositions = [...originalPositions];
      
      for (let i = 0; i < positions.length; i += 3) {
        const pulse = Math.sin(time + originalPositions[i] * 2 + originalPositions[i + 1] * 1.5) * 0.5 + 0.5;
        const intensity = 0.03 * pulse * pulse;
        
        newPositions[i] = originalPositions[i] + normals[i] * intensity;
        newPositions[i + 1] = originalPositions[i + 1] + normals[i + 1] * intensity;
        newPositions[i + 2] = originalPositions[i + 2] + normals[i + 2] * intensity;
      }
      
      mesh.updateVerticesData(VertexBuffer.PositionKind, newPositions, true);
      
      if (mesh.material) {
        const pulse = Math.sin(time) * 0.5 + 0.5;
        mesh.material.emissiveColor = new Color3(
          0.1 + pulse * 0.2,
          0.05 + pulse * 0.1,
          0.3 + pulse * 0.2
        );
      }
      
      requestAnimationFrame(animate);
    };
    
    activeAnimations.set(animId, { startTime: performance.now() });
    requestAnimationFrame(animate);
  },

  stopNormalPulseAnimation() {
    for (const [key, value] of activeAnimations) {
      if (key.startsWith('normal-pulse')) {
        activeAnimations.delete(key);
      }
    }
  },

  startRippleAnimation(mesh, scene) {
    if (!mesh) return;
    
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const originalPositions = [...positions];
    let time = 0;
    
    const animId = 'ripple-' + mesh.id;
    
    const center = [0, 0, 0];
    let maxDist = 0;
    
    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - center[0];
      const dy = positions[i + 1] - center[1];
      const dz = positions[i + 2] - center[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      maxDist = Math.max(maxDist, dist);
    }
    
    const animate = () => {
      if (!activeAnimations.has(animId)) return;
      
      time += 0.02;
      const newPositions = [...originalPositions];
      
      for (let i = 0; i < positions.length; i += 3) {
        const dx = originalPositions[i] - center[0];
        const dy = originalPositions[i + 1] - center[1];
        const dz = originalPositions[i + 2] - center[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const normalizedDist = dist / maxDist;
        
        const wave = Math.sin(normalizedDist * 10 - time * 3) * 0.5 + 0.5;
        const intensity = 0.02 * wave * (1 - normalizedDist);
        
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const nz = dz / (dist || 1);
        
        newPositions[i] = originalPositions[i] + nx * intensity;
        newPositions[i + 1] = originalPositions[i + 1] + ny * intensity;
        newPositions[i + 2] = originalPositions[i + 2] + nz * intensity;
      }
      
      mesh.updateVerticesData(VertexBuffer.PositionKind, newPositions, true);
      
      if (mesh.material) {
        const wave = Math.sin(time * 2) * 0.5 + 0.5;
        mesh.material.diffuseColor = new Color3(
          0.6 + wave * 0.1,
          0.7 + wave * 0.1,
          0.9 + wave * 0.1
        );
      }
      
      requestAnimationFrame(animate);
    };
    
    activeAnimations.set(animId, { startTime: performance.now() });
    requestAnimationFrame(animate);
  },

  stopRippleAnimation() {
    for (const [key, value] of activeAnimations) {
      if (key.startsWith('ripple')) {
        activeAnimations.delete(key);
      }
    }
  },

  startNoiseAnimation(mesh, scene) {
    if (!mesh) return;
    
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const originalPositions = [...positions];
    let time = 0;
    
    const animId = 'noise-' + mesh.id;
    
    const hash = (x, y, z) => {
      let h = x * 374761393 + y * 668265263 + z * 245248717;
      h = (h ^ (h >> 13)) * 1274126177;
      return (h ^ (h >> 16)) / 2147483647.0;
    };
    
    const smoothstep = (edge0, edge1, x) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };
    
    const valueNoise = (x, y, z) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const zi = Math.floor(z);
      
      const xf = x - xi;
      const yf = y - yi;
      const zf = z - zi;
      
      const v000 = hash(xi, yi, zi);
      const v100 = hash(xi + 1, yi, zi);
      const v010 = hash(xi, yi + 1, zi);
      const v110 = hash(xi + 1, yi + 1, zi);
      const v001 = hash(xi, yi, zi + 1);
      const v101 = hash(xi + 1, yi, zi + 1);
      const v011 = hash(xi, yi + 1, zi + 1);
      const v111 = hash(xi + 1, yi + 1, zi + 1);
      
      const u = smoothstep(0, 1, xf);
      const v = smoothstep(0, 1, yf);
      const w = smoothstep(0, 1, zf);
      
      const x1 = v000 * (1 - u) + v100 * u;
      const x2 = v010 * (1 - u) + v110 * u;
      const x3 = v001 * (1 - u) + v101 * u;
      const x4 = v011 * (1 - u) + v111 * u;
      
      const y1 = x1 * (1 - v) + x2 * v;
      const y2 = x3 * (1 - v) + x4 * v;
      
      return y1 * (1 - w) + y2 * w;
    };
    
    const animate = () => {
      if (!activeAnimations.has(animId)) return;
      
      time += 0.015;
      
      if (mesh.material) {
        const noise1 = valueNoise(time * 2, 0, 0);
        const noise2 = valueNoise(0, time * 2.5, 0);
        const noise3 = valueNoise(0, 0, time * 3);
        
        const flicker = 0.3 + (noise1 * 0.3 + noise2 * 0.3 + noise3 * 0.4) * 0.4;
        const pulse = Math.sin(time * 4) * 0.1 + 0.9;
        
        mesh.material.diffuseColor = new Color3(
          0.5 * pulse + flicker * 0.2,
          0.6 * pulse + flicker * 0.15,
          0.8 * pulse + flicker * 0.1
        );
        
        mesh.material.emissiveColor = new Color3(
          flicker * 0.3,
          flicker * 0.15,
          flicker * 0.4
        );
        
        mesh.material.specularColor = new Color3(
          0.5 + noise1 * 0.3,
          0.5 + noise2 * 0.3,
          0.7 + noise3 * 0.3
        );
      }
      
      requestAnimationFrame(animate);
    };
    
    activeAnimations.set(animId, { startTime: performance.now() });
    requestAnimationFrame(animate);
  },

  stopNoiseAnimation() {
    for (const [key, value] of activeAnimations) {
      if (key.startsWith('noise')) {
        activeAnimations.delete(key);
      }
    }
  },

  stopAllAnimations() {
    activeAnimations.clear();
  },

  async animateUndoRedo(fromMesh, toMesh, scene) {
    return new Promise((resolve) => {
      const duration = 500;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutQuad(progress);
        
        if (fromMesh) {
          fromMesh.visibility = 1 - eased;
        }
        
        if (toMesh) {
          toMesh.visibility = eased;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      if (toMesh) {
        toMesh.visibility = 0;
      }
      
      requestAnimationFrame(animate);
    });
  },

  async animateExplosion(mesh, scene) {
    return new Promise((resolve) => {
      const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
      const originalPositions = [...positions];
      
      const center = [0, 0, 0];
      for (let i = 0; i < positions.length; i += 3) {
        center[0] += positions[i];
        center[1] += positions[i + 1];
        center[2] += positions[i + 2];
      }
      center[0] /= positions.length / 3;
      center[1] /= positions.length / 3;
      center[2] /= positions.length / 3;
      
      const duration = 1200;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInExpo(progress);
        
        const newPositions = [...originalPositions];
        const maxExplosion = 0.5;
        
        for (let i = 0; i < positions.length; i += 3) {
          const dx = originalPositions[i] - center[0];
          const dy = originalPositions[i + 1] - center[1];
          const dz = originalPositions[i + 2] - center[2];
          
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const factor = 1 + dist * maxExplosion * eased;
          
          newPositions[i] = center[0] + dx * factor;
          newPositions[i + 1] = center[1] + dy * factor;
          newPositions[i + 2] = center[2] + dz * factor;
        }
        
        mesh.updateVerticesData(VertexBuffer.PositionKind, newPositions, true);
        
        if (mesh.material) {
          const pulse = Math.sin(progress * Math.PI) * 0.5 + 0.5;
          mesh.material.emissiveColor = new Color3(
            0.5 * pulse,
            0.2 * pulse,
            0
          );
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
};

export default createAnimations;
