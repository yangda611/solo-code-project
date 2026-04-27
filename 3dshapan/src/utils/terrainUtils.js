export const TERRAIN_SIZE = 50;
export const TERRAIN_RESOLUTION = 100;
export const MAX_HEIGHT = 15;
export const MIN_HEIGHT = -5;
export const GROUND_HEIGHT = MIN_HEIGHT - 1;
export const WATER_LEVEL = -1;

export function createFlatTerrain(resolution = TERRAIN_RESOLUTION) {
  const heights = new Float32Array(resolution * resolution);
  const water = new Float32Array(resolution * resolution);
  return { heights, water, resolution };
}

export function createTerrainGeometry(heights, resolution = TERRAIN_RESOLUTION) {
  const size = TERRAIN_SIZE;
  const halfSize = size / 2;
  const step = size / (resolution - 1);
  
  const vertices = [];
  const normals = [];
  const indices = [];
  const colors = [];

  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const idx = z * resolution + x;
      const xPos = -halfSize + x * step;
      const zPos = -halfSize + z * step;
      const yPos = heights[idx];

      vertices.push(xPos, yPos, zPos);
      
      const color = getTerrainColor(yPos);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let z = 0; z < resolution - 1; z++) {
    for (let x = 0; x < resolution - 1; x++) {
      const topLeft = z * resolution + x;
      const topRight = topLeft + 1;
      const bottomLeft = (z + 1) * resolution + x;
      const bottomRight = bottomLeft + 1;

      indices.push(topLeft, bottomLeft, topRight);
      indices.push(topRight, bottomLeft, bottomRight);
    }
  }

  computeNormals(vertices, indices, normals, resolution);

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    colors: new Float32Array(colors),
    resolution
  };
}

function getTerrainColor(height) {
  if (height < WATER_LEVEL) {
    return { r: 0.1, g: 0.3, b: 0.6 };
  } else if (height < 0) {
    return { r: 0.2, g: 0.5, b: 0.2 };
  } else if (height < 3) {
    return { r: 0.3, g: 0.6, b: 0.2 };
  } else if (height < 6) {
    return { r: 0.4, g: 0.5, b: 0.3 };
  } else if (height < 9) {
    return { r: 0.5, g: 0.45, b: 0.4 };
  } else {
    return { r: 0.9, g: 0.9, b: 0.95 };
  }
}

function computeNormals(vertices, indices, normals, resolution) {
  const tempNormals = new Array(vertices.length / 3).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const v0 = { x: vertices[i0], y: vertices[i0 + 1], z: vertices[i0 + 2] };
    const v1 = { x: vertices[i1], y: vertices[i1 + 1], z: vertices[i1 + 2] };
    const v2 = { x: vertices[i2], y: vertices[i2 + 1], z: vertices[i2 + 2] };

    const e1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const e2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

    const normal = {
      x: e1.y * e2.z - e1.z * e2.y,
      y: e1.z * e2.x - e1.x * e2.z,
      z: e1.x * e2.y - e1.y * e2.x
    };

    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (len > 0) {
      normal.x /= len;
      normal.y /= len;
      normal.z /= len;
    }

    tempNormals[indices[i]].x += normal.x;
    tempNormals[indices[i]].y += normal.y;
    tempNormals[indices[i]].z += normal.z;

    tempNormals[indices[i + 1]].x += normal.x;
    tempNormals[indices[i + 1]].y += normal.y;
    tempNormals[indices[i + 1]].z += normal.z;

    tempNormals[indices[i + 2]].x += normal.x;
    tempNormals[indices[i + 2]].y += normal.y;
    tempNormals[indices[i + 2]].z += normal.z;
  }

  for (let i = 0; i < tempNormals.length; i++) {
    const n = tempNormals[i];
    const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
    if (len > 0) {
      normals.push(n.x / len, n.y / len, n.z / len);
    } else {
      normals.push(0, 1, 0);
    }
  }
}

export function applyBrush(heights, centerX, centerZ, strength, radius, operation, resolution = TERRAIN_RESOLUTION) {
  const newHeights = new Float32Array(heights);
  const affectedIndices = [];

  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const idx = z * resolution + x;
      const dx = (x - centerX) / resolution * TERRAIN_SIZE;
      const dz = (z - centerZ) / resolution * TERRAIN_SIZE;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < radius) {
        const falloff = 1 - (dist / radius);
        const effect = strength * falloff * falloff;

        switch (operation) {
          case 'raise':
            newHeights[idx] = Math.min(MAX_HEIGHT, newHeights[idx] + effect);
            break;
          case 'lower':
            newHeights[idx] = Math.max(MIN_HEIGHT, newHeights[idx] - effect);
            break;
          case 'flatten':
            const targetHeight = heights[Math.floor(centerZ) * resolution + Math.floor(centerX)];
            const diff = targetHeight - newHeights[idx];
            newHeights[idx] += diff * effect * 0.1;
            break;
          case 'smooth':
            const avg = getAverageHeight(heights, x, z, resolution);
            newHeights[idx] += (avg - newHeights[idx]) * effect * 0.5;
            break;
        }
        
        affectedIndices.push(idx);
      }
    }
  }

  return { newHeights, affectedIndices };
}

function getAverageHeight(heights, x, z, resolution) {
  let sum = 0;
  let count = 0;
  
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx >= 0 && nx < resolution && nz >= 0 && nz < resolution) {
        sum += heights[nz * resolution + nx];
        count++;
      }
    }
  }
  
  return sum / count;
}

export function generateTerrainPattern(mode, resolution = TERRAIN_RESOLUTION) {
  const heights = new Float32Array(resolution * resolution);
  const halfRes = resolution / 2;

  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const idx = z * resolution + x;
      const nx = (x - halfRes) / halfRes;
      const nz = (z - halfRes) / halfRes;
      const dist = Math.sqrt(nx * nx + nz * nz);
      const angle = Math.atan2(nz, nx);

      switch (mode) {
        case 'mountain':
          const mountainNoise = Math.sin(nx * 5) * Math.cos(nz * 5) + 
                               Math.sin(nx * 3) * Math.cos(nz * 7) * 0.5;
          heights[idx] = (1 - dist) * 8 + mountainNoise * 2;
          break;

        case 'river':
          const riverWidth = 0.15;
          const riverPath = Math.sin(angle * 3) * 0.3;
          const riverDist = Math.abs(nz - riverPath);
          
          if (riverDist < riverWidth) {
            heights[idx] = WATER_LEVEL - 1;
          } else {
            const bankHeight = Math.max(0, (riverDist - riverWidth) * 3);
            heights[idx] = bankHeight + Math.sin(nx * 4) * Math.cos(nz * 4) * 0.5;
          }
          break;

        case 'basin':
          const basinDepth = Math.max(0, dist - 0.3);
          heights[idx] = -basinDepth * 5 + Math.sin(nx * 6) * Math.cos(nz * 6) * 0.3;
          if (dist < 0.4) {
            heights[idx] = Math.min(heights[idx], WATER_LEVEL - 0.5);
          }
          break;

        case 'canyon':
          const canyonDir = Math.abs(Math.cos(angle));
          const canyonWidth = 0.1 + Math.sin(nx * 2 + nz * 2) * 0.05;
          const canyonDist = Math.abs(nx * canyonDir - nz * (1 - canyonDir));
          
          if (canyonDist < canyonWidth) {
            heights[idx] = -4 + Math.random() * 0.5;
          } else {
            heights[idx] = Math.min(6, (canyonDist - canyonWidth) * 10) + 
                           Math.sin(nx * 3) * Math.cos(nz * 3) * 0.8;
          }
          break;

        case 'hills':
        default:
          const hillsNoise = Math.sin(nx * 4) * Math.cos(nz * 4) * 2 +
                            Math.sin(nx * 7 + 1) * Math.cos(nz * 5 + 2) * 1;
          heights[idx] = hillsNoise;
          break;
      }
      
      heights[idx] = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, heights[idx]));
    }
  }

  return heights;
}

export function simulateWaterFlow(water, heights, resolution = TERRAIN_RESOLUTION) {
  const newWater = new Float32Array(water);
  const flowSpeed = 0.1;
  
  for (let z = 1; z < resolution - 1; z++) {
    for (let x = 1; x < resolution - 1; x++) {
      const idx = z * resolution + x;
      const waterLevel = water[idx];
      
      if (waterLevel <= 0) continue;

      const currentTotal = heights[idx] + waterLevel;

      const neighbors = [
        { x: x - 1, z: z, idx: z * resolution + (x - 1) },
        { x: x + 1, z: z, idx: z * resolution + (x + 1) },
        { x: x, z: z - 1, idx: (z - 1) * resolution + x },
        { x: x, z: z + 1, idx: (z + 1) * resolution + x }
      ];

      for (const neighbor of neighbors) {
        const neighborTotal = heights[neighbor.idx] + water[neighbor.idx];
        
        if (currentTotal > neighborTotal) {
          const diff = (currentTotal - neighborTotal) * flowSpeed * 0.25;
          const transfer = Math.min(waterLevel, diff);
          
          newWater[idx] -= transfer;
          newWater[neighbor.idx] += transfer;
        }
      }
    }
  }

  const evaporation = 0.001;
  for (let i = 0; i < newWater.length; i++) {
    if (newWater[i] > 0) {
      newWater[i] = Math.max(0, newWater[i] - evaporation);
    }
  }

  return newWater;
}
