import type { Point3D } from '~/types/hp-model';

export const manhattanDistance = (a: Point3D, b: Point3D): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
};

export const euclideanDistance = (a: Point3D, b: Point3D): number => {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + 
    Math.pow(a.y - b.y, 2) + 
    Math.pow(a.z - b.z, 2)
  );
};

export const areAdjacent = (a: Point3D, b: Point3D): boolean => {
  return manhattanDistance(a, b) === 1;
};

export const clonePosition = (p: Point3D): Point3D => ({
  x: p.x,
  y: p.y,
  z: p.z
});

export const clonePositions = (positions: Point3D[]): Point3D[] => {
  return positions.map(clonePosition);
};

export const getNeighbors = (p: Point3D): Point3D[] => [
  { x: p.x + 1, y: p.y, z: p.z },
  { x: p.x - 1, y: p.y, z: p.z },
  { x: p.x, y: p.y + 1, z: p.z },
  { x: p.x, y: p.y - 1, z: p.z },
  { x: p.x, y: p.y, z: p.z + 1 },
  { x: p.x, y: p.y, z: p.z - 1 }
];

export const positionEquals = (a: Point3D, b: Point3D): boolean => {
  return a.x === b.x && a.y === b.y && a.z === b.z;
};

export const isPositionOccupied = (
  pos: Point3D,
  positions: Point3D[],
  excludeIndex: number = -1
): boolean => {
  return positions.some((p, i) => i !== excludeIndex && positionEquals(p, pos));
};

export const getEmptyNeighbors = (
  pos: Point3D,
  positions: Point3D[],
  excludeIndex: number
): Point3D[] => {
  return getNeighbors(pos).filter(
    n => !isPositionOccupied(n, positions, excludeIndex)
  );
};

export const generateLinearConformation = (length: number): Point3D[] => {
  const positions: Point3D[] = [];
  const start = -Math.floor(length / 2);
  for (let i = 0; i < length; i++) {
    positions.push({ x: start + i, y: 0, z: 0 });
  }
  return positions;
};

export const generateRandomConformation = (length: number): Point3D[] => {
  const positions: Point3D[] = [{ x: 0, y: 0, z: 0 }];
  const directions = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 }
  ];

  for (let i = 1; i < length; i++) {
    const prev = positions[i - 1];
    const emptyNeighbors = directions
      .map(d => ({ x: prev.x + d.x, y: prev.y + d.y, z: prev.z + d.z }))
      .filter(n => !isPositionOccupied(n, positions));

    if (emptyNeighbors.length === 0) {
      return generateLinearConformation(length);
    }

    positions.push(emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)]);
  }

  return positions;
};
