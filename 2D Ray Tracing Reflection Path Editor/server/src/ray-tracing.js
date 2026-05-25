class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mul(s) {
    return new Vector2(this.x * s, this.y * s);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  reflect(normal) {
    const dot = this.dot(normal);
    return this.sub(normal.mul(2 * dot));
  }

  refract(normal, eta1, eta2) {
    const eta = eta1 / eta2;
    const dot = this.dot(normal);
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    return this.mul(eta).sub(normal.mul(eta * dot + Math.sqrt(k)));
  }
}

function fresnel(cosThetaI, eta1, eta2) {
  const sinThetaTSq = (eta1 / eta2) ** 2 * Math.max(0, 1 - cosThetaI ** 2);
  if (sinThetaTSq > 1) return { reflectance: 1, transmittance: 0 };
  const cosThetaT = Math.sqrt(1 - sinThetaTSq);
  const rs = ((eta2 * cosThetaI) - (eta1 * cosThetaT)) / ((eta2 * cosThetaI) + (eta1 * cosThetaT));
  const rp = ((eta1 * cosThetaI) - (eta2 * cosThetaT)) / ((eta1 * cosThetaI) + (eta2 * cosThetaT));
  const reflectance = (rs ** 2 + rp ** 2) / 2;
  return { reflectance, transmittance: 1 - reflectance };
}

function lineIntersection(origin, direction, line) {
  const p1 = new Vector2(line.x1, line.y1);
  const p2 = new Vector2(line.x2, line.y2);
  const edge = p2.sub(p1);
  const perp = new Vector2(-direction.y, direction.x);
  const det = edge.dot(perp);
  if (Math.abs(det) < 1e-8) return null;
  const t = p1.sub(origin).dot(perp) / det;
  if (t < 0 || t > 1) return null;
  const edgePerp = new Vector2(-edge.y, edge.x);
  const u = p1.sub(origin).dot(edgePerp) / det;
  if (u < 1e-8) return null;
  const point = origin.add(direction.mul(u));
  const normal = edgePerp.normalize();
  if (normal.dot(direction) > 0) {
    normal.x = -normal.x;
    normal.y = -normal.y;
  }
  return { point, normal, t: u, line };
}

function findNearestIntersection(origin, direction, obstacles) {
  let nearest = null;
  let minDist = Infinity;
  for (const obs of obstacles) {
    const hit = lineIntersection(origin, direction, obs);
    if (hit && hit.t < minDist) {
      minDist = hit.t;
      nearest = hit;
    }
  }
  return nearest;
}

function traceRay(origin, direction, obstacles, maxBounces, energy = 1, depth = 0, path = []) {
  if (depth > maxBounces || energy < 0.01) {
    return { path, escaped: true };
  }
  const hit = findNearestIntersection(origin, direction, obstacles);
  if (!hit) {
    path.push({
      type: 'escape',
      start: { x: origin.x, y: origin.y },
      end: { x: origin.x + direction.x * 1000, y: origin.y + direction.y * 1000 },
      energy,
      depth
    });
    return { path, escaped: true };
  }
  path.push({
    type: 'segment',
    start: { x: origin.x, y: origin.y },
    end: { x: hit.point.x, y: hit.point.y },
    energy,
    depth
  });
  const material = hit.line.material || 'mirror';
  if (material === 'absorber') {
    path.push({
      type: 'absorb',
      point: { x: hit.point.x, y: hit.point.y },
      energy,
      depth
    });
    return { path, escaped: false };
  }
  const eta1 = 1;
  const eta2 = hit.line.refractiveIndex || 1.5;
  const cosThetaI = Math.abs(direction.dot(hit.normal));
  const { reflectance, transmittance } = fresnel(cosThetaI, eta1, eta2);
  const reflectedDir = direction.reflect(hit.normal).normalize();
  const result = { path, escaped: false };
  if (reflectance > 0.01) {
    const reflected = traceRay(
      hit.point.add(reflectedDir.mul(1e-6)),
      reflectedDir,
      obstacles,
      maxBounces,
      energy * reflectance,
      depth + 1,
      path
    );
    result.path = reflected.path;
    result.escaped = reflected.escaped;
  }
  if (transmittance > 0.01 && material === 'transparent') {
    const refractedDir = direction.refract(hit.normal, eta1, eta2);
    if (refractedDir) {
      path.push({
        type: 'refraction',
        point: { x: hit.point.x, y: hit.point.y },
        energy: energy * transmittance,
        depth
      });
      const refracted = traceRay(
        hit.point.add(refractedDir.mul(1e-6)),
        refractedDir,
        obstacles,
        maxBounces,
        energy * transmittance,
        depth + 1,
        path
      );
      result.path = [...result.path, ...refracted.path];
    }
  }
  return result;
}

function traceLightSource(light, obstacles, maxBounces = 10) {
  const origin = new Vector2(light.x, light.y);
  const allPaths = [];
  if (light.type === 'parallel') {
    const dir = new Vector2(Math.cos(light.angle), Math.sin(light.angle));
    for (let i = -light.beamWidth / 2; i <= light.beamWidth / 2; i += light.beamStep || 5) {
      const offset = new Vector2(-dir.y, dir.x).mul(i);
      const result = traceRay(origin.add(offset), dir, obstacles, maxBounces);
      allPaths.push(...result.path);
    }
  } else {
    const numRays = light.numRays || 36;
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      const dir = new Vector2(Math.cos(angle), Math.sin(angle));
      const result = traceRay(origin, dir, obstacles, maxBounces);
      allPaths.push(...result.path);
    }
  }
  return allPaths;
}

function detectClosedLoop(paths, maxIterations = 100) {
  const loops = [];
  for (let i = 0; i < Math.min(paths.length, maxIterations); i++) {
    for (let j = i + 1; j < Math.min(paths.length, maxIterations); j++) {
      const p1 = paths[i];
      const p2 = paths[j];
      if (p1.end && p2.end &&
          Math.abs(p1.end.x - p2.end.x) < 1 &&
          Math.abs(p1.end.y - p2.end.y) < 1) {
        loops.push({ start: i, end: j, point: p1.end });
      }
    }
  }
  return loops;
}

module.exports = {
  Vector2,
  fresnel,
  findNearestIntersection,
  traceRay,
  traceLightSource,
  detectClosedLoop
};
