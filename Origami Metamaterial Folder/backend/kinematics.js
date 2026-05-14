const math = require('mathjs');

class SphericalLinkageSolver {
  constructor(vertices, edges, faces) {
    this.vertices = vertices;
    this.edges = edges;
    this.faces = faces;
  }

  calculateDegreesOfFreedom() {
    const V = this.vertices.length;
    const E = this.edges.length;
    const F = this.faces.length;
    const dof = 3 * (V - 1) - E + (F - 1);
    return Math.max(0, dof);
  }

  checkRigidFoldability() {
    const dof = this.calculateDegreesOfFreedom();
    const hasValidTopology = this.checkKawasakiTheorem();
    const hasValidAngles = this.checkMaekawaTheorem();
    
    return {
      isRigidFoldable: dof >= 1 && hasValidTopology && hasValidAngles,
      degreesOfFreedom: dof,
      satisfiesKawasaki: hasValidTopology,
      satisfiesMaekawa: hasValidAngles
    };
  }

  checkKawasakiTheorem() {
    const vertexValences = {};
    this.edges.forEach(edge => {
      vertexValences[edge.start] = (vertexValences[edge.start] || 0) + 1;
      vertexValences[edge.end] = (vertexValences[edge.end] || 0) + 1;
    });
    
    for (const vertex in vertexValences) {
      if (vertexValences[vertex] % 2 !== 0) return false;
    }
    return true;
  }

  checkMaekawaTheorem() {
    let mountainCount = 0;
    let valleyCount = 0;
    
    this.edges.forEach(edge => {
      if (edge.type === 'mountain') mountainCount++;
      if (edge.type === 'valley') valleyCount++;
    });
    
    return Math.abs(mountainCount - valleyCount) === 2;
  }

  computeDihedralAngles(foldingProgress = 0) {
    const angles = [];
    this.edges.forEach((edge, index) => {
      const baseAngle = edge.type === 'mountain' ? Math.PI : 0;
      const targetAngle = edge.type === 'mountain' ? 0 : Math.PI;
      const currentAngle = baseAngle + (targetAngle - baseAngle) * foldingProgress;
      angles.push({
        edgeIndex: index,
        angle: currentAngle,
        type: edge.type
      });
    });
    return angles;
  }

  detectThicknessInterference(thickness) {
    const interferences = [];
    const tolerance = thickness * 1.5;
    
    for (let i = 0; i < this.faces.length; i++) {
      for (let j = i + 1; j < this.faces.length; j++) {
        const distance = this.calculateFaceDistance(i, j);
        if (distance < tolerance) {
          interferences.push({
            face1: i,
            face2: j,
            distance: distance,
            severity: (tolerance - distance) / tolerance
          });
        }
      }
    }
    return interferences;
  }

  calculateFaceDistance(face1, face2) {
    const f1 = this.faces[face1];
    const f2 = this.faces[face2];
    
    let minDist = Infinity;
    f1.vertices.forEach(v1 => {
      f2.vertices.forEach(v2 => {
        const dist = math.norm(math.subtract(
          [this.vertices[v1].x, this.vertices[v1].y, this.vertices[v1].z || 0],
          [this.vertices[v2].x, this.vertices[v2].y, this.vertices[v2].z || 0]
        ));
        minDist = Math.min(minDist, dist);
      });
    });
    return minDist;
  }

  detectOverconstraints() {
    const overconstraints = [];
    const dof = this.calculateDegreesOfFreedom();
    
    if (dof < 0) {
      overconstraints.push({
        type: 'global',
        severity: Math.abs(dof),
        message: '系统过约束，可能导致面板弹性变形'
      });
    }
    
    this.vertices.forEach((v, idx) => {
      const connectedEdges = this.edges.filter(e => 
        e.start === idx || e.end === idx
      );
      if (connectedEdges.length > 6) {
        overconstraints.push({
          type: 'vertex',
          vertexIndex: idx,
          severity: connectedEdges.length - 6,
          message: `顶点 ${idx} 过约束`
        });
      }
    });
    
    return overconstraints;
  }

  checkDeadlockConfiguration(angles) {
    const deadlocks = [];
    
    for (let i = 0; i < angles.length; i++) {
      for (let j = i + 1; j < angles.length; j++) {
        const angleDiff = Math.abs(angles[i].angle - angles[j].angle);
        if (angleDiff < 0.1 && angles[i].type !== angles[j].type) {
          deadlocks.push({
            edge1: i,
            edge2: j,
            severity: 1 - angleDiff / 0.1
          });
        }
      }
    }
    
    return deadlocks;
  }
}

module.exports = SphericalLinkageSolver;
