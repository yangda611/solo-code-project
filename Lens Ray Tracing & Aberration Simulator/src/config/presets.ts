import * as THREE from 'three';
import type { Preset, Lens } from '@/types/optics';

const createLens = (
  position: number,
  radius1: number,
  radius2: number,
  thickness: number,
  refractiveIndex: number,
  aperture: number
): Lens => ({
  id: `lens-${Math.random().toString(36).substr(2, 9)}`,
  position,
  radius1,
  radius2,
  thickness,
  refractiveIndex,
  aperture
});

export const PRESETS: Preset[] = [
  {
    id: 'preset-1',
    name: '厚透镜主点偏移',
    description: '演示厚透镜的主点偏移导致成像位置与薄透镜公式预测不符的现象',
    lenses: [
      createLens(2, 2.5, -2.5, 1.5, 1.62, 1.2),
      createLens(6, 3.0, -3.0, 1.2, 1.58, 1.2)
    ],
    objectPoint: new THREE.Vector3(0, 0, -5),
    rayCount: 15,
    wavelengths: [550],
    showAberrationType: 'spherical'
  },
  {
    id: 'preset-2',
    name: '色散失配焦点分离',
    description: '演示不同波长光线因色散导致的焦点分离现象，红光和蓝光聚焦在不同位置',
    lenses: [
      createLens(3, 8.0, -8.0, 1.5, 1.75, 2.0)
    ],
    objectPoint: new THREE.Vector3(0, 0, -10),
    rayCount: 10,
    wavelengths: [420, 480, 550, 620, 700, 750],
    showAberrationType: 'chromatic'
  },
  {
    id: 'preset-3',
    name: '大孔径球差弥散',
    description: '演示大孔径光束的球差现象，边缘光线与近轴光线聚焦于不同位置形成弥散斑',
    lenses: [
      createLens(4, 6.0, -6.0, 1.5, 1.6, 2.5)
    ],
    objectPoint: new THREE.Vector3(0, 0, -12),
    rayCount: 21,
    wavelengths: [550],
    showAberrationType: 'spherical'
  },
  {
    id: 'preset-4',
    name: '全反射逃逸',
    description: '演示非近轴大角度光线在透镜内表面发生全反射而突然消失的现象',
    lenses: [
      createLens(4, 4.0, 8.0, 3.0, 1.9, 2.0)
    ],
    objectPoint: new THREE.Vector3(0, 0, -6),
    rayCount: 25,
    wavelengths: [550],
    showAberrationType: 'totalReflection'
  }
];

export const DEFAULT_PRESET = PRESETS[0];
