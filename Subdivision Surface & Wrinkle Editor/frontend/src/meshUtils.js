import { Mesh, VertexData, Vector3, Color3, StandardMaterial, VertexBuffer, LinesMesh } from '@babylonjs/core';

export const meshUtils = {
  createMeshFromData(meshData, scene) {
    const mesh = new Mesh('subdivided-mesh', scene);
    
    const positions = [];
    const indices = [];
    const normals = [];
    const colors = [];
    const uvs = [];
    
    const vertices = meshData.vertices;
    const faces = meshData.faces;
    
    for (const face of faces) {
      if (face.length === 3) {
        for (const idx of face) {
          const v = vertices[idx];
          positions.push(v[0], v[1], v[2]);
          
          if (meshData.normals && meshData.normals[idx]) {
            const n = meshData.normals[idx];
            normals.push(n[0], n[1], n[2]);
          }
          
          uvs.push(0.5, 0.5);
          
          const hasCrease = meshData.creases?.some(c => 
            c.edges?.some(e => e.includes(idx))
          );
          
          if (hasCrease) {
            colors.push(1, 0.6, 0.2, 1);
          } else {
            colors.push(0.7, 0.8, 0.9, 1);
          }
        }
        
        const baseIdx = positions.length / 3 - 3;
        indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      } else if (face.length === 4) {
        for (const idx of face) {
          const v = vertices[idx];
          positions.push(v[0], v[1], v[2]);
          
          if (meshData.normals && meshData.normals[idx]) {
            const n = meshData.normals[idx];
            normals.push(n[0], n[1], n[2]);
          }
          
          uvs.push(0.5, 0.5);
          
          const hasCrease = meshData.creases?.some(c => 
            c.edges?.some(e => e.includes(idx))
          );
          
          if (hasCrease) {
            colors.push(1, 0.6, 0.2, 1);
          } else {
            colors.push(0.7, 0.8, 0.9, 1);
          }
        }
        
        const baseIdx = positions.length / 3 - 4;
        indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
        indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
      }
    }
    
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    
    if (normals.length > 0) {
      vertexData.normals = normals;
    } else {
      VertexData.ComputeNormals(positions, indices, vertexData.normals);
    }
    
    vertexData.colors = colors;
    vertexData.uvs = uvs;
    
    vertexData.applyToMesh(mesh, true);
    
    mesh.computeWorldMatrix(true);
    
    return mesh;
  },

  extractMeshData(mesh) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
    const indices = mesh.getIndices();
    
    const vertices = [];
    const faces = [];
    const vertexNormals = [];
    
    for (let i = 0; i < positions.length; i += 3) {
      vertices.push([
        positions[i],
        positions[i + 1],
        positions[i + 2]
      ]);
      
      if (normals) {
        vertexNormals.push([
          normals[i],
          normals[i + 1],
          normals[i + 2]
        ]);
      }
    }
    
    for (let i = 0; i < indices.length; i += 3) {
      faces.push([indices[i], indices[i + 1], indices[i + 2]]);
    }
    
    return {
      vertices,
      faces,
      normals: vertexNormals.length > 0 ? vertexNormals : null
    };
  },

  lerpVertices(fromVerts, toVerts, t) {
    return fromVerts.map((v, i) => [
      v[0] + (toVerts[i][0] - v[0]) * t,
      v[1] + (toVerts[i][1] - v[1]) * t,
      v[2] + (toVerts[i][2] - v[2]) * t
    ]);
  },

  updateMeshPositions(mesh, vertices) {
    const positions = [];
    for (const v of vertices) {
      positions.push(v[0], v[1], v[2]);
    }
    mesh.updateVerticesData(VertexBuffer.PositionKind, positions, true);
    mesh.computeWorldMatrix(true);
  },

  showNormals(mesh, scene) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
    
    if (!normals) return;
    
    const lines = [];
    for (let i = 0; i < positions.length; i += 3) {
      const start = new Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      );
      const end = new Vector3(
        positions[i] + normals[i] * 0.1,
        positions[i + 1] + normals[i + 1] * 0.1,
        positions[i + 2] + normals[i + 2] * 0.1
      );
      lines.push([start, end]);
    }
    
    const normalLines = Mesh.CreateLineSystem('normals', { lines, updatable: false }, scene);
    const lineMaterial = new StandardMaterial('normalMat', scene);
    lineMaterial.emissiveColor = new Color3(1, 0, 1);
    normalLines.material = lineMaterial;
    normalLines.parent = mesh;
    
    return normalLines;
  },

  hideNormals(mesh) {
    if (mesh && mesh._children) {
      mesh._children.forEach(child => {
        if (child.name === 'normals') {
          child.dispose();
        }
      });
    }
  },

  getCreaseVertices(meshData) {
    const creaseSet = new Set();
    
    if (meshData.creases) {
      for (const crease of meshData.creases) {
        if (crease.edges) {
          for (const edge of crease.edges) {
            creaseSet.add(edge[0]);
            creaseSet.add(edge[1]);
          }
        }
      }
    }
    
    return creaseSet;
  },

  createCreaseLines(meshData, scene) {
    if (!meshData.creases) return null;
    
    const lines = [];
    
    for (const crease of meshData.creases) {
      if (crease.edges) {
        for (const edge of crease.edges) {
          const v1 = meshData.vertices[edge[0]];
          const v2 = meshData.vertices[edge[1]];
          
          if (v1 && v2) {
            lines.push([
              new Vector3(v1[0], v1[1], v1[2]),
              new Vector3(v2[0], v2[1], v2[2])
            ]);
          }
        }
      }
    }
    
    if (lines.length === 0) return null;
    
    const creaseLines = Mesh.CreateLineSystem('creaseLines', { lines, updatable: true }, scene);
    const mat = new StandardMaterial('creaseLineMat', scene);
    mat.emissiveColor = new Color3(1, 0.5, 0);
    creaseLines.material = mat;
    creaseLines.renderingGroupId = 1;
    
    return creaseLines;
  },

  computeFaceCenter(vertices, face) {
    let cx = 0, cy = 0, cz = 0;
    for (const idx of face) {
      cx += vertices[idx][0];
      cy += vertices[idx][1];
      cz += vertices[idx][2];
    }
    const n = face.length;
    return [cx / n, cy / n, cz / n];
  }
};

export default meshUtils;
