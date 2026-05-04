export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

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

export interface GalleryLayout {
  id: string;
  galleryId: string;
  exhibitId: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  createdAt: number;
}

export interface LightConfig {
  id: string;
  galleryId: string;
  type: 'ambient' | 'directional' | 'point' | 'spot';
  name: string;
  color: string;
  intensity: number;
  position: Vector3D;
  rotation: Vector3D;
  targetPosition?: Vector3D;
  distance?: number;
  angle?: number;
  penumbra?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TourPoint {
  position: Vector3D;
  rotation: Vector3D;
  waitTime: number;
  focusTarget?: string;
}

export interface TourPath {
  id: string;
  galleryId: string;
  name: string;
  points: TourPoint[];
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

export interface PresetInfo {
  type: string;
  name: string;
  description: string;
}

export type AnimationType = 
  | 'none'
  | 'drag'
  | 'light'
  | 'flythrough'
  | 'highlight'
  | 'transition';

export interface AppState {
  currentGalleryId: string | null;
  galleries: Gallery[];
  exhibits: Exhibit[];
  layout: GalleryLayout[];
  lights: LightConfig[];
  tourPaths: TourPath[];
  versions: ExhibitionVersion[];
  presets: PresetInfo[];
  selectedItemId: string | null;
  isPlayingTour: boolean;
  currentTourIndex: number;
  activeAnimation: AnimationType;
  isLoading: boolean;
  error: string | null;
}
