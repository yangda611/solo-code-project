export interface Exhibit {
  id: string;
  name: string;
  type: 'sculpture' | 'painting' | 'display_case';
  description: string;
  modelPath?: string;
  texturePath?: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface GalleryLayout {
  id: string;
  galleryId: string;
  exhibitId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  createdAt: number;
}

export interface LightConfig {
  id: string;
  galleryId: string;
  type: 'ambient' | 'directional' | 'point' | 'spot';
  name: string;
  color: string;
  intensity: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  distance?: number;
  angle?: number;
  penumbra?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TourPath {
  id: string;
  galleryId: string;
  name: string;
  points: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    waitTime: number;
    focusTarget?: string;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface ExhibitionVersion {
  id: string;
  galleryId: string;
  version: number;
  name: string;
  description: string;
  layoutSnapshot: GalleryLayout[];
  lightsSnapshot: LightConfig[];
  tourPathsSnapshot: TourPath[];
  createdAt: number;
}

export interface Gallery {
  id: string;
  name: string;
  description: string;
  presetType?: 'modern' | 'ancient' | 'overexposed' | 'obstructed';
  width: number;
  depth: number;
  height: number;
  createdAt: number;
  updatedAt: number;
}
