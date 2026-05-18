import type { Point3D } from '~/types/hp-model';
import { clonePositions, getEmptyNeighbors, areAdjacent } from './geometry';

export type MoveType = 'end' | 'corner' | 'crankshaft' | 'slider';

export interface Move {
  type: MoveType;
  index: number;
  newPositions: Point3D[];
}

const tryEndMove = (
  positions: Point3D[],
  index: number
): Point3D[] | null => {
  const isNEnd = index === 0;
  const isCEnd = index === positions.length - 1;
  if (!isNEnd && !isCEnd) return null;

  const neighborIndex = isNEnd ? 1 : positions.length - 2;
  const neighborPos = positions[neighborIndex];
  const emptyNeighbors = getEmptyNeighbors(neighborPos, positions, index);

  if (emptyNeighbors.length === 0) return null;

  const newPositions = clonePositions(positions);
  const chosen = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
  newPositions[index] = chosen;
  return newPositions;
};

const tryCornerMove = (
  positions: Point3D[],
  index: number
): Point3D[] | null => {
  if (index <= 0 || index >= positions.length - 1) return null;

  const prevPos = positions[index - 1];
  const nextPos = positions[index + 1];
  if (areAdjacent(prevPos, nextPos)) {
    const newPos = {
      x: prevPos.x + nextPos.x - positions[index].x,
      y: prevPos.y + nextPos.y - positions[index].y,
      z: prevPos.z + nextPos.z - positions[index].z
    };

    const occupied = positions.some((p, i) => 
      i !== index && p.x === newPos.x && p.y === newPos.y && p.z === newPos.z
    );

    if (!occupied) {
      const newPositions = clonePositions(positions);
      newPositions[index] = newPos;
      return newPositions;
    }
  }
  return null;
};

const tryCrankshaftMove = (
  positions: Point3D[],
  index: number
): Point3D[] | null => {
  if (index <= 0 || index >= positions.length - 2) return null;

  const p0 = positions[index - 1];
  const p1 = positions[index];
  const p2 = positions[index + 1];
  const p3 = positions[index + 2];

  const dx1 = p1.x - p0.x;
  const dy1 = p1.y - p0.y;
  const dz1 = p1.z - p0.z;
  const dx2 = p3.x - p2.x;
  const dy2 = p3.y - p2.y;
  const dz2 = p3.z - p2.z;

  if (Math.abs(dx1) + Math.abs(dy1) + Math.abs(dz1) !== 1) return null;
  if (Math.abs(dx2) + Math.abs(dy2) + Math.abs(dz2) !== 1) return null;

  const dotProduct = dx1 * dx2 + dy1 * dy2 + dz1 * dz2;
  if (dotProduct !== 0) return null;

  const newP1 = { x: p0.x + dx2, y: p0.y + dy2, z: p0.z + dz2 };
  const newP2 = { x: p3.x + dx1, y: p3.y + dy1, z: p3.z + dz1 };

  const occupied1 = positions.some((p, i) => 
    i !== index && p.x === newP1.x && p.y === newP1.y && p.z === newP1.z
  );
  const occupied2 = positions.some((p, i) => 
    i !== index + 1 && p.x === newP2.x && p.y === newP2.y && p.z === newP2.z
  );

  if (!occupied1 && !occupied2) {
    const newPositions = clonePositions(positions);
    newPositions[index] = newP1;
    newPositions[index + 1] = newP2;
    return newPositions;
  }

  return null;
};

const trySliderMove = (
  positions: Point3D[],
  index: number
): Point3D[] | null => {
  if (index <= 0 || index >= positions.length - 2) return null;

  const prevPos = positions[index - 1];
  const nextPos = positions[index + 1];
  const nextNextPos = positions[index + 2];

  const moveDir = {
    x: nextNextPos.x - nextPos.x,
    y: nextNextPos.y - nextPos.y,
    z: nextNextPos.z - nextPos.z
  };

  const newPos = {
    x: prevPos.x + moveDir.x,
    y: prevPos.y + moveDir.y,
    z: prevPos.z + moveDir.z
  };

  const occupied = positions.some((p, i) => 
    i !== index && p.x === newPos.x && p.y === newPos.y && p.z === newPos.z
  );

  if (!occupied) {
    const newPositions = clonePositions(positions);
    newPositions[index] = newPos;
    return newPositions;
  }

  return null;
};

export const generateRandomMove = (positions: Point3D[]): Point3D[] | null => {
  const n = positions.length;
  const moveTypes: MoveType[] = ['end', 'corner', 'crankshaft', 'slider'];
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const moveType = moveTypes[Math.floor(Math.random() * moveTypes.length)];
    const index = Math.floor(Math.random() * n);

    let result: Point3D[] | null = null;

    switch (moveType) {
      case 'end':
        result = tryEndMove(positions, index === 0 ? 0 : n - 1);
        break;
      case 'corner':
        result = tryCornerMove(positions, index);
        break;
      case 'crankshaft':
        result = tryCrankshaftMove(positions, index);
        break;
      case 'slider':
        result = trySliderMove(positions, index);
        break;
    }

    if (result) return result;
  }

  return null;
};

export const generateValidMove = (positions: Point3D[]): Point3D[] => {
  const n = positions.length;
  for (let i = 0; i < n; i++) {
    const idx = i < n / 2 ? i : n - 1 - (i - n / 2);
    const result = tryEndMove(positions, idx === 0 ? 0 : n - 1);
    if (result) return result;
  }

  for (let i = 1; i < n - 1; i++) {
    const result = tryCornerMove(positions, i);
    if (result) return result;
  }

  return clonePositions(positions);
};
