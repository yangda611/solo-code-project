export class CatmullClarkSubdivider {
  constructor() {
    this.creaseSharpness = 10;
  }

  vertexKey(v) {
    return v.join(',');
  }

  edgeKey(v1, v2) {
    const sorted = [Math.min(v1, v2), Math.max(v1, v2)];
    return sorted.join('-');
  }

  findEdgeNeighbors(faces, edgeStart, edgeEnd) {
    const neighbors = [];
    for (let f = 0; f < faces.length; f++) {
      const face = faces[f];
      for (let i = 0; i < face.length; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % face.length];
        if ((v1 === edgeStart && v2 === edgeEnd) || (v1 === edgeEnd && v2 === edgeStart)) {
          neighbors.push(f);
          break;
        }
      }
    }
    return neighbors;
  }

  findVertexEdges(faces, vertexIndex) {
    const edges = [];
    for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % face.length];
        if (v1 === vertexIndex || v2 === vertexIndex) {
          edges.push({ v1, v2, face });
        }
      }
    }
    return edges;
  }

  findVertexNeighbors(faces, vertexIndex) {
    const neighbors = new Set();
    for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
        if (face[i] === vertexIndex) {
          neighbors.add(face[(i + face.length - 1) % face.length]);
          neighbors.add(face[(i + 1) % face.length]);
        }
      }
    }
    return Array.from(neighbors);
  }

  findVertexFaces(faces, vertexIndex) {
    const vertexFaces = [];
    for (let f = 0; f < faces.length; f++) {
      if (faces[f].includes(vertexIndex)) {
        vertexFaces.push(f);
      }
    }
    return vertexFaces;
  }

  vAdd(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
  }

  vSub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
  }

  vScale(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }

  vLen(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  }

  vNormalize(v) {
    const len = this.vLen(v);
    if (len < 1e-6) return [0, 0, 0];
    return this.vScale(v, 1 / len);
  }

  vAvg(vertices) {
    if (vertices.length === 0) return [0, 0, 0];
    const sum = vertices.reduce((acc, v) => this.vAdd(acc, v), [0, 0, 0]);
    return this.vScale(sum, 1 / vertices.length);
  }

  computeFacePoints(vertices, faces) {
    return faces.map(face => {
      const faceVertices = face.map(idx => vertices[idx]);
      return this.vAvg(faceVertices);
    });
  }

  computeEdgePoints(vertices, faces, facePoints, creaseMap = new Map()) {
    const edgeMap = new Map();
    
    for (let f = 0; f < faces.length; f++) {
      const face = faces[f];
      for (let i = 0; i < face.length; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % face.length];
        const key = this.edgeKey(v1, v2);
        
        if (!edgeMap.has(key)) {
          edgeMap.set(key, { v1, v2, faces: [f] });
        } else {
          edgeMap.get(key).faces.push(f);
        }
      }
    }

    const edgePoints = new Map();
    for (const [key, edge] of edgeMap) {
      const mid = this.vAvg([vertices[edge.v1], vertices[edge.v2]]);
      const creaseWeight = creaseMap.get(key) || 0;
      const isCrease = creaseWeight > 0;
      
      if (edge.faces.length === 1 || isCrease) {
        edgePoints.set(key, mid);
      } else {
        const fp1 = facePoints[edge.faces[0]];
        const fp2 = facePoints[edge.faces[1]];
        const base = this.vAvg([mid, fp1, fp2]);
        edgePoints.set(key, base);
      }
    }

    return { edgeMap, edgePoints };
  }

  computeVertexRules(vertices, faces, facePoints, edgeMap, edgePoints, creaseMap = new Map()) {
    const newVertices = [];
    
    for (let vIdx = 0; vIdx < vertices.length; vIdx++) {
      const neighbors = this.findVertexNeighbors(faces, vIdx);
      const vertexFaces = this.findVertexFaces(faces, vIdx);
      const n = neighbors.length;
      
      let creaseEdges = 0;
      for (const neighbor of neighbors) {
        const key = this.edgeKey(vIdx, neighbor);
        if ((creaseMap.get(key) || 0) > 0) creaseEdges++;
      }

      const isBoundary = creaseEdges >= 2 || this.isVertexOnBoundary(faces, vIdx, creaseMap);
      
      let newPos;
      
      if (isBoundary) {
        const boundaryNeighbors = this.findBoundaryNeighbors(faces, vIdx, creaseMap);
        if (boundaryNeighbors.length === 2) {
          const avg = this.vAvg([
            vertices[boundaryNeighbors[0]],
            vertices[boundaryNeighbors[1]]
          ]);
          const weighted = this.vAvg([
            this.vScale(vertices[vIdx], 3),
            this.vScale(avg, 1)
          ]);
          newPos = this.vScale(weighted, 0.25);
        } else {
          newPos = vertices[vIdx].slice();
        }
      } else {
        const Q = this.vAvg(vertexFaces.map(f => facePoints[f]));
        const R = this.vAvg(neighbors.map(neighbor => {
          const key = this.edgeKey(vIdx, neighbor);
          return this.vAvg([vertices[vIdx], vertices[neighbor]]);
        }));
        const S = vertices[vIdx];
        
        const weightQ = 1 / n;
        const weightR = 2 / n;
        const weightS = (n - 3) / n;
        
        newPos = this.vAdd(
          this.vAdd(
            this.vScale(Q, weightQ),
            this.vScale(R, weightR)
          ),
          this.vScale(S, weightS)
        );
      }

      newVertices.push(newPos);
    }
    
    return newVertices;
  }

  isVertexOnBoundary(faces, vIdx, creaseMap) {
    const neighbors = this.findVertexNeighbors(faces, vIdx);
    for (const neighbor of neighbors) {
      const key = this.edgeKey(vIdx, neighbor);
      const neighbors2 = this.findEdgeNeighbors(faces, vIdx, neighbor);
      if (neighbors2.length <= 1 || (creaseMap.get(key) || 0) > 0) {
        return true;
      }
    }
    return false;
  }

  findBoundaryNeighbors(faces, vIdx, creaseMap) {
    const boundaries = [];
    const neighbors = this.findVertexNeighbors(faces, vIdx);
    
    for (const neighbor of neighbors) {
      const key = this.edgeKey(vIdx, neighbor);
      const edgeNeighbors = this.findEdgeNeighbors(faces, vIdx, neighbor);
      if (edgeNeighbors.length <= 1 || (creaseMap.get(key) || 0) > 0) {
        boundaries.push(neighbor);
      }
    }
    
    return boundaries;
  }

  buildNewFaces(vertices, faces, facePoints, edgeMap, edgePoints, newVertices) {
    const edgeList = new Map();
    const newFaces = [];
    const finalVertices = [];
    const vertexMap = new Map();

    const addVertex = (v) => {
      const key = this.vertexKey(v);
      if (!vertexMap.has(key)) {
        vertexMap.set(key, finalVertices.length);
        finalVertices.push(v);
      }
      return vertexMap.get(key);
    };

    for (const [key, edge] of edgeMap) {
      edgeList.set(key, edge);
    }

    for (let fIdx = 0; fIdx < faces.length; fIdx++) {
      const face = faces[fIdx];
      const fp = facePoints[fIdx];
      const fpIdx = addVertex(fp);
      
      for (let i = 0; i < face.length; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % face.length];
        const edgeKey = this.edgeKey(v1, v2);
        const ep = edgePoints.get(edgeKey);
        const epIdx = addVertex(ep);
        
        const v1Pos = newVertices[v1];
        const vIdx = addVertex(v1Pos);
        
        const nextV1 = face[(i + face.length - 1) % face.length];
        const prevEdgeKey = this.edgeKey(nextV1, v1);
        const prevEp = edgePoints.get(prevEdgeKey);
        const prevEpIdx = addVertex(prevEp);
        
        newFaces.push([vIdx, epIdx, fpIdx, prevEpIdx]);
      }
    }

    return { vertices: finalVertices, faces: newFaces };
  }

  subdivide(vertices, faces, creases = [], levels = 1) {
    let currentVerts = vertices.map(v => [...v]);
    let currentFaces = faces.map(f => [...f]);
    const creaseMap = new Map();
    
    for (const crease of creases) {
      if (crease.edges) {
        for (const edge of crease.edges) {
          const key = this.edgeKey(edge[0], edge[1]);
          creaseMap.set(key, crease.weight || 1);
        }
      }
    }

    const levelsData = [{
      vertices: currentVerts,
      faces: currentFaces,
      creases: [...creases]
    }];

    for (let lvl = 0; lvl < levels; lvl++) {
      const facePoints = this.computeFacePoints(currentVerts, currentFaces);
      const { edgeMap, edgePoints } = this.computeEdgePoints(currentVerts, currentFaces, facePoints, creaseMap);
      const newVertices = this.computeVertexRules(currentVerts, currentFaces, facePoints, edgeMap, edgePoints, creaseMap);
      const result = this.buildNewFaces(currentVerts, currentFaces, facePoints, edgeMap, edgePoints, newVertices);
      
      currentVerts = result.vertices;
      currentFaces = result.faces;

      levelsData.push({
        vertices: currentVerts,
        faces: currentFaces,
        creases: [...creases]
      });
    }

    return levelsData;
  }

  applyProblems(mesh, problemType) {
    const vertices = mesh.vertices.map(v => [...v]);
    const faces = mesh.faces.map(f => [...f]);
    
    switch (problemType) {
      case 'non-manifold':
        return this.addNonManifoldEdges(vertices, faces);
      case 'sharp-tear':
        return this.addSharpTears(vertices, faces);
      case 'explosion':
        return this.addExplosionDisplacement(vertices, faces);
      case 'flipped-normal':
        return this.addFlippedNormals(vertices, faces);
      default:
        return { vertices, faces };
    }
  }

  addNonManifoldEdges(vertices, faces) {
    const n = vertices.length;
    const center = this.vAvg(vertices);
    const up = [0, 0.3, 0];
    const down = [0, -0.3, 0];
    const left = [-0.3, 0, 0];
    const right = [0.3, 0, 0];
    
    vertices.push(
      this.vAdd(center, up),
      this.vAdd(center, down),
      this.vAdd(center, left),
      this.vAdd(center, right)
    );
    
    faces.push(
      [n, n + 1, n + 2],
      [n, n + 1, n + 3],
      [n, n + 2, n + 1],
      [n, n + 3, n + 1]
    );
    
    return { vertices, faces };
  }

  addSharpTears(vertices, faces) {
    if (vertices.length < 4) return { vertices, faces };
    
    for (let i = 0; i < vertices.length; i++) {
      if (i % 7 === 0) {
        const displacement = (Math.random() - 0.5) * 0.4;
        vertices[i][0] += displacement;
        vertices[i][1] += displacement * 0.5;
        vertices[i][2] += (Math.random() - 0.5) * 0.2;
      }
    }
    
    return { vertices, faces };
  }

  addExplosionDisplacement(vertices, faces) {
    const center = this.vAvg(vertices);
    
    for (let i = 0; i < vertices.length; i++) {
      const dir = this.vNormalize(this.vSub(vertices[i], center));
      const dist = this.vLen(this.vSub(vertices[i], center));
      const factor = 1 + Math.pow(dist, 0.5) * (Math.random() * 2 + 1);
      vertices[i] = this.vAdd(center, this.vScale(dir, factor));
    }
    
    return { vertices, faces };
  }

  addFlippedNormals(vertices, faces) {
    for (let i = 0; i < faces.length; i++) {
      if (i % 5 === 0 && faces[i].length >= 3) {
        faces[i] = [faces[i][0], faces[i][2], faces[i][1]];
      }
    }
    
    return { vertices, faces };
  }

  computeNormals(vertices, faces) {
    const vertexNormals = vertices.map(() => [0, 0, 0]);
    
    for (const face of faces) {
      if (face.length < 3) continue;
      
      const v0 = vertices[face[0]];
      const v1 = vertices[face[1]];
      const v2 = vertices[face[2]];
      
      const e1 = this.vSub(v1, v0);
      const e2 = this.vSub(v2, v0);
      
      const normal = this.vNormalize([
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0]
      ]);
      
      for (const vIdx of face) {
        vertexNormals[vIdx] = this.vAdd(vertexNormals[vIdx], normal);
      }
    }
    
    return vertexNormals.map(n => this.vNormalize(n));
  }
}

export default new CatmullClarkSubdivider();
