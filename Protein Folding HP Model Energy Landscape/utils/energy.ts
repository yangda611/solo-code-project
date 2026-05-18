import type { Point3D, ResidueType, ContactPair } from '~/types/hp-model';
import { areAdjacent } from './geometry';

export const calculateHydrophobicContacts = (
  positions: Point3D[],
  sequence: ResidueType[]
): ContactPair[] => {
  const contacts: ContactPair[] = [];
  const n = positions.length;

  for (let i = 0; i < n; i++) {
    if (sequence[i] !== 'H') continue;
    for (let j = i + 1; j < n; j++) {
      if (sequence[j] !== 'H') continue;
      if (Math.abs(i - j) <= 1) continue;
      if (areAdjacent(positions[i], positions[j])) {
        contacts.push({ i, j });
      }
    }
  }

  return contacts;
};

export const countNativeContacts = (
  positions: Point3D[],
  sequence: ResidueType[]
): number => {
  return calculateHydrophobicContacts(positions, sequence).length;
};

export const calculateEnergy = (
  positions: Point3D[],
  sequence: ResidueType[],
  hydrophobicStrength: number
): number => {
  const contactCount = countNativeContacts(positions, sequence);
  return -hydrophobicStrength * contactCount;
};

export const calculateDeltaE = (
  oldPositions: Point3D[],
  newPositions: Point3D[],
  sequence: ResidueType[],
  hydrophobicStrength: number
): number => {
  const oldEnergy = calculateEnergy(oldPositions, sequence, hydrophobicStrength);
  const newEnergy = calculateEnergy(newPositions, sequence, hydrophobicStrength);
  return newEnergy - oldEnergy;
};

export const metropolisAcceptanceProbability = (
  deltaE: number,
  temperature: number
): number => {
  if (deltaE <= 0) return 1;
  return Math.exp(-deltaE / temperature);
};

export const shouldAcceptMove = (
  deltaE: number,
  temperature: number
): boolean => {
  const prob = metropolisAcceptanceProbability(deltaE, temperature);
  return Math.random() < prob;
};

export const calculateFreeEnergy = (
  energy: number,
  entropy: number,
  temperature: number
): number => {
  return energy - temperature * entropy;
};

export const estimateConformationalEntropy = (
  chainLength: number,
  contacts: number
): number => {
  const maxEntropy = Math.log(Math.pow(5, chainLength - 1));
  const contactPenalty = contacts * 0.5;
  return Math.max(0, maxEntropy - contactPenalty);
};
