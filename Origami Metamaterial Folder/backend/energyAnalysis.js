const math = require('mathjs');

class BistableEnergyAnalyzer {
  constructor(vertices, edges, faces, thickness = 0.1) {
    this.vertices = vertices;
    this.edges = edges;
    this.faces = faces;
    this.thickness = thickness;
    this.k_stiffness = 100;
    this.k_bending = 50;
  }

  computePotentialEnergy(dihedralAngles) {
    let totalEnergy = 0;
    
    totalEnergy += this.computeBendingEnergy(dihedralAngles);
    totalEnergy += this.computeStrainEnergy(dihedralAngles);
    totalEnergy += this.computeContactEnergy(dihedralAngles);
    
    return totalEnergy;
  }

  computeBendingEnergy(dihedralAngles) {
    let energy = 0;
    dihedralAngles.forEach((angleData, idx) => {
      const edge = this.edges[idx];
      const restAngle = edge.type === 'mountain' ? 0 : Math.PI;
      const delta = angleData.angle - restAngle;
      energy += 0.5 * this.k_bending * delta * delta;
    });
    return energy;
  }

  computeStrainEnergy(dihedralAngles) {
    let energy = 0;
    const deformedVertices = this.deformVertices(dihedralAngles);
    
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      energy += this.computeFaceStrain(face, deformedVertices);
    }
    
    return energy;
  }

  computeFaceStrain(face, deformedVertices) {
    const originalArea = this.computeFaceArea(face, this.vertices);
    const deformedArea = this.computeFaceArea(face, deformedVertices);
    const strain = Math.abs(deformedArea - originalArea) / originalArea;
    return 0.5 * this.k_stiffness * strain * strain;
  }

  computeFaceArea(face, vertices) {
    if (face.vertices.length < 3) return 0;
    const v0 = vertices[face.vertices[0]];
    const v1 = vertices[face.vertices[1]];
    const v2 = vertices[face.vertices[2]];
    
    const cross = math.cross(
      [v1.x - v0.x, v1.y - v0.y, (v1.z || 0) - (v0.z || 0)],
      [v2.x - v0.x, v2.y - v0.y, (v2.z || 0) - (v0.z || 0)]
    );
    
    return 0.5 * math.norm(cross);
  }

  deformVertices(dihedralAngles) {
    const deformed = JSON.parse(JSON.stringify(this.vertices));
    
    dihedralAngles.forEach((angleData, idx) => {
      const edge = this.edges[idx];
      const deformation = angleData.type === 'mountain' ? -0.05 : 0.05;
      
      if (deformed[edge.start]) {
        deformed[edge.start].z = (deformed[edge.start].z || 0) + deformation;
      }
      if (deformed[edge.end]) {
        deformed[edge.end].z = (deformed[edge.end].z || 0) - deformation;
      }
    });
    
    return deformed;
  }

  computeContactEnergy(dihedralAngles) {
    let energy = 0;
    const tolerance = this.thickness * 1.2;
    
    for (let i = 0; i < this.faces.length; i++) {
      for (let j = i + 1; j < this.faces.length; j++) {
        const dist = this.calculateFaceDistance(i, j, dihedralAngles);
        if (dist < tolerance) {
          const overlap = tolerance - dist;
          energy += 1000 * overlap * overlap;
        }
      }
    }
    
    return energy;
  }

  calculateFaceDistance(face1, face2, dihedralAngles) {
    const f1 = this.faces[face1];
    const f2 = this.faces[face2];
    const deformedVertices = this.deformVertices(dihedralAngles);
    
    let minDist = Infinity;
    f1.vertices.forEach(v1 => {
      f2.vertices.forEach(v2 => {
        const dist = math.norm(math.subtract(
          [deformedVertices[v1].x, deformedVertices[v1].y, deformedVertices[v1].z || 0],
          [deformedVertices[v2].x, deformedVertices[v2].y, deformedVertices[v2].z || 0]
        ));
        minDist = Math.min(minDist, dist);
      });
    });
    return minDist;
  }

  computeEnergyLandscape(resolution = 20) {
    const landscape = [];
    const wells = [];
    const barriers = [];
    
    for (let i = 0; i <= resolution; i++) {
      const progress1 = i / resolution;
      const row = [];
      
      for (let j = 0; j <= resolution; j++) {
        const progress2 = j / resolution;
        const angles = this.generateMixedAngles(progress1, progress2);
        const energy = this.computePotentialEnergy(angles);
        
        row.push({
          progress1,
          progress2,
          energy,
          angles
        });
      }
      
      landscape.push(row);
    }
    
    const { foundWells, foundBarriers } = this.analyzeLandscapeFeatures(landscape);
    wells.push(...foundWells);
    barriers.push(...foundBarriers);
    
    return {
      landscape,
      wells,
      barriers,
      isBistable: wells.length >= 2
    };
  }

  generateMixedAngles(progress1, progress2) {
    return this.edges.map((edge, idx) => {
      const progress = idx % 2 === 0 ? progress1 : progress2;
      const baseAngle = edge.type === 'mountain' ? Math.PI : 0;
      const targetAngle = edge.type === 'mountain' ? 0 : Math.PI;
      return {
        edgeIndex: idx,
        angle: baseAngle + (targetAngle - baseAngle) * progress,
        type: edge.type
      };
    });
  }

  analyzeLandscapeFeatures(landscape) {
    const foundWells = [];
    const foundBarriers = [];
    
    for (let i = 1; i < landscape.length - 1; i++) {
      for (let j = 1; j < landscape[i].length - 1; j++) {
        const current = landscape[i][j].energy;
        const neighbors = [
          landscape[i-1][j].energy,
          landscape[i+1][j].energy,
          landscape[i][j-1].energy,
          landscape[i][j+1].energy
        ];
        
        if (neighbors.every(n => n > current)) {
          foundWells.push({
            x: landscape[i][j].progress1,
            y: landscape[i][j].progress2,
            energy: current,
            depth: Math.min(...neighbors) - current
          });
        }
        
        if (neighbors.every(n => n < current)) {
          foundBarriers.push({
            x: landscape[i][j].progress1,
            y: landscape[i][j].progress2,
            energy: current,
            height: current - Math.max(...neighbors)
          });
        }
      }
    }
    
    return { foundWells, foundBarriers };
  }

  checkAccidentalJump(wells, threshold = 5) {
    if (wells.length < 2) return false;
    
    const minBarrier = Math.min(...wells.map(w => w.depth));
    return minBarrier < threshold;
  }

  generateFoldingSequence(steps = 50) {
    const sequence = [];
    
    for (let step = 0; step <= steps; step++) {
      const progress = step / steps;
      const angles = this.edges.map((edge, idx) => {
        const staggeredProgress = Math.max(0, Math.min(1, progress - idx * 0.02));
        const baseAngle = edge.type === 'mountain' ? Math.PI : 0;
        const targetAngle = edge.type === 'mountain' ? 0 : Math.PI;
        return {
          edgeIndex: idx,
          angle: baseAngle + (targetAngle - baseAngle) * staggeredProgress,
          type: edge.type
        };
      });
      
      sequence.push({
        step,
        progress,
        angles,
        energy: this.computePotentialEnergy(angles)
      });
    }
    
    return sequence;
  }
}

module.exports = BistableEnergyAnalyzer;
