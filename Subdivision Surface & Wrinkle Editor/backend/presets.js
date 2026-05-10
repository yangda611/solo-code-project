export const presets = {
  smoothSphere: {
    name: '光滑球体',
    description: '完美的细分球体，展示平滑曲面效果',
    generate: () => {
      const vertices = [];
      const faces = [];
      const creases = [];
      
      const detail = 10;
      const radius = 1;
      
      for (let i = 0; i <= detail; i++) {
        for (let j = 0; j < detail; j++) {
          const phi = (i / detail) * Math.PI;
          const theta = (j / detail) * Math.PI * 2;
          vertices.push([
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
          ]);
        }
      }
      
      for (let i = 0; i < detail; i++) {
        for (let j = 0; j < detail; j++) {
          const current = i * detail + j;
          const next = ((j + 1) % detail) + i * detail;
          const below = current + detail;
          const belowNext = next + detail;
          
          if (i < detail - 1) {
            faces.push([current, next, belowNext, below]);
          }
        }
      }
      
      return { vertices, faces, creases };
    }
  },
  
  sharpCreaseRing: {
    name: '尖锐折痕环',
    description: '带有强折痕的圆环，展示尖锐边角效果',
    generate: () => {
      const vertices = [];
      const faces = [];
      const creaseEdges = [];
      
      const majorRadius = 1.2;
      const minorRadius = 0.4;
      const majorSegs = 24;
      const minorSegs = 12;
      
      for (let i = 0; i < majorSegs; i++) {
        const u = (i / majorSegs) * Math.PI * 2;
        const cx = Math.cos(u) * majorRadius;
        const cz = Math.sin(u) * majorRadius;
        
        for (let j = 0; j < minorSegs; j++) {
          const v = (j / minorSegs) * Math.PI * 2;
          const nx = Math.cos(v) * Math.cos(u);
          const ny = Math.sin(v);
          const nz = Math.cos(v) * Math.sin(u);
          
          vertices.push([
            cx + nx * minorRadius,
            ny * minorRadius,
            cz + nz * minorRadius
          ]);
        }
      }
      
      for (let i = 0; i < majorSegs; i++) {
        for (let j = 0; j < minorSegs; j++) {
          const a = i * minorSegs + j;
          const b = i * minorSegs + ((j + 1) % minorSegs);
          const c = ((i + 1) % majorSegs) * minorSegs + j;
          const d = ((i + 1) % majorSegs) * minorSegs + ((j + 1) % minorSegs);
          
          faces.push([a, b, d, c]);
        }
      }
      
      for (let i = 0; i < majorSegs; i++) {
        const next = (i + 1) % majorSegs;
        const crease1 = i * minorSegs;
        const crease2 = i * minorSegs + minorSegs / 4;
        const crease3 = i * minorSegs + minorSegs / 2;
        const crease4 = i * minorSegs + minorSegs * 3 / 4;
        
        const nextCrease1 = next * minorSegs;
        const nextCrease2 = next * minorSegs + minorSegs / 4;
        const nextCrease3 = next * minorSegs + minorSegs / 2;
        const nextCrease4 = next * minorSegs + minorSegs * 3 / 4;
        
        creaseEdges.push([crease1, nextCrease1]);
        creaseEdges.push([crease2, nextCrease2]);
        creaseEdges.push([crease3, nextCrease3]);
        creaseEdges.push([crease4, nextCrease4]);
      }
      
      return {
        vertices,
        faces,
        creases: [{
          edges: creaseEdges,
          weight: 10
        }]
      };
    }
  },
  
  boundaryNormalError: {
    name: '边界错误法线',
    description: '带有翻转法线的边界网格，展示黑斑渲染错误',
    generate: () => {
      const vertices = [];
      const faces = [];
      const creases = [];
      
      const size = 1;
      const detail = 6;
      
      for (let i = 0; i <= detail; i++) {
        for (let j = 0; j <= detail; j++) {
          const x = (i / detail - 0.5) * size * 2;
          const z = (j / detail - 0.5) * size * 2;
          const y = Math.sin(x * 3) * Math.cos(z * 3) * 0.3;
          
          vertices.push([x, y, z]);
        }
      }
      
      for (let i = 0; i < detail; i++) {
        for (let j = 0; j < detail; j++) {
          const a = i * (detail + 1) + j;
          const b = a + 1;
          const c = a + (detail + 1);
          const d = c + 1;
          
          if (i % 3 === 0 && j % 3 === 0) {
            faces.push([a, c, d, b]);
          } else {
            faces.push([a, b, d, c]);
          }
        }
      }
      
      const creaseEdges = [];
      for (let j = 0; j < detail; j++) {
        creaseEdges.push([j, j + 1]);
        creaseEdges.push([(detail) * (detail + 1) + j, (detail) * (detail + 1) + j + 1]);
      }
      
      creases.push({ edges: creaseEdges, weight: 8 });
      
      return { vertices, faces, creases };
    }
  },
  
  selfIntersecting: {
    name: '自交折叠面',
    description: '复杂折叠几何，展示自交和细分问题',
    generate: () => {
      const vertices = [];
      const faces = [];
      const creases = [];
      
      const detail = 12;
      for (let i = 0; i <= detail; i++) {
        const u = i / detail * Math.PI * 2;
        for (let j = 0; j <= detail; j++) {
          const v = j / detail * Math.PI;
          
          const r = 0.8 + 0.3 * Math.sin(u * 3);
          const x = r * Math.sin(v) * Math.cos(u);
          const y = Math.cos(v);
          const z = r * Math.sin(v) * Math.sin(u);
          
          vertices.push([
            x + 0.2 * Math.sin(u * 2 + v * 3),
            y,
            z
          ]);
        }
      }
      
      for (let i = 0; i < detail; i++) {
        for (let j = 0; j < detail; j++) {
          const a = i * (detail + 1) + j;
          const b = a + 1;
          const c = a + (detail + 1);
          const d = c + 1;
          
          if ((i + j) % 5 === 0) {
            faces.push([a, c, d, b]);
          } else {
            faces.push([a, b, d, c]);
          }
        }
      }
      
      const creaseEdges = [];
      for (let j = 0; j < detail; j += 2) {
        creaseEdges.push([0, j]);
        creaseEdges.push([(detail) * (detail + 1), (detail) * (detail + 1) + j]);
      }
      
      creases.push({ edges: creaseEdges, weight: 6 });
      
      return { vertices, faces, creases };
    }
  }
};

export default presets;
