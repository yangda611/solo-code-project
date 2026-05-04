import type { Gallery, GalleryLayout, LightConfig, TourPath, Exhibit } from '../database/schema';

export interface PresetGallery {
  gallery: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>;
  exhibits: Omit<Exhibit, 'id' | 'createdAt' | 'updatedAt'>[];
  layout: Omit<GalleryLayout, 'id' | 'galleryId' | 'createdAt'>[];
  lights: Omit<LightConfig, 'id' | 'galleryId' | 'createdAt' | 'updatedAt'>[];
  tourPaths: Omit<TourPath, 'id' | 'galleryId' | 'createdAt' | 'updatedAt'>[];
}

export const modernArtGallery: PresetGallery = {
  gallery: {
    name: '现代艺术展厅',
    description: '展示当代艺术作品的现代展厅，简洁明亮的设计风格',
    presetType: 'modern',
    width: 30,
    depth: 20,
    height: 5,
  },
  exhibits: [
    {
      name: '抽象雕塑 #1',
      type: 'sculpture',
      description: '现代主义金属雕塑，几何形状组合',
      metadata: { color: '#E8E8E8', shape: 'geometric' },
    },
    {
      name: '星空画作',
      type: 'painting',
      description: '印象派风格的星空主题画作',
      metadata: { width: 4, height: 3, color: '#1a1a2e' },
    },
    {
      name: '现代展柜 A',
      type: 'display_case',
      description: '玻璃展柜，展示小型艺术品',
      metadata: { width: 2, height: 1.5, depth: 1 },
    },
    {
      name: '流动形态雕塑',
      type: 'sculpture',
      description: '有机形态的大理石雕塑',
      metadata: { color: '#F5F5DC', shape: 'organic' },
    },
    {
      name: '城市风景',
      type: 'painting',
      description: '现代城市景观的抽象表达',
      metadata: { width: 3, height: 2, color: '#4a5568' },
    },
  ],
  layout: [],
  lights: [
    {
      type: 'ambient',
      name: '环境光',
      color: '#ffffff',
      intensity: 0.6,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    {
      type: 'directional',
      name: '主光源',
      color: '#FFF5E6',
      intensity: 1.2,
      position: { x: 0, y: 8, z: -10 },
      rotation: { x: -0.5, y: 0, z: 0 },
      targetPosition: { x: 0, y: 0, z: 0 },
    },
    {
      type: 'point',
      name: '聚光灯 1',
      color: '#FFD700',
      intensity: 50,
      position: { x: -8, y: 4, z: -5 },
      rotation: { x: 0, y: 0, z: 0 },
      distance: 15,
    },
    {
      type: 'point',
      name: '聚光灯 2',
      color: '#FFD700',
      intensity: 50,
      position: { x: 8, y: 4, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      distance: 15,
    },
  ],
  tourPaths: [
    {
      name: '经典参观路线',
      points: [
        { position: { x: 0, y: 2.5, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, waitTime: 2000 },
        { position: { x: -5, y: 2.5, z: -5 }, rotation: { x: 0, y: 0.5, z: 0 }, waitTime: 3000 },
        { position: { x: -8, y: 2.5, z: 0 }, rotation: { x: 0, y: 1, z: 0 }, waitTime: 2000 },
        { position: { x: -5, y: 2.5, z: 5 }, rotation: { x: 0, y: 1.5, z: 0 }, waitTime: 3000 },
        { position: { x: 0, y: 2.5, z: 8 }, rotation: { x: 0, y: Math.PI, z: 0 }, waitTime: 2000 },
      ],
    },
  ],
};

export const ancientGallery: PresetGallery = {
  gallery: {
    name: '古代文物展厅',
    description: '展示古代文物和历史艺术品的展厅，古典优雅的设计',
    presetType: 'ancient',
    width: 25,
    depth: 25,
    height: 6,
  },
  exhibits: [
    {
      name: '希腊大理石雕像',
      type: 'sculpture',
      description: '古希腊时期的大理石人物雕像',
      metadata: { color: '#F5F5DC', era: 'ancient_greek' },
    },
    {
      name: '古埃及壁画',
      type: 'painting',
      description: '古埃及墓室壁画复制品',
      metadata: { width: 5, height: 3, color: '#D4A373' },
    },
    {
      name: '中国青铜器展柜',
      type: 'display_case',
      description: '展示古代青铜器的木质展柜',
      metadata: { width: 3, height: 2, depth: 1.5, material: 'wood' },
    },
    {
      name: '罗马半身像',
      type: 'sculpture',
      description: '古罗马帝国时期的青铜半身像',
      metadata: { color: '#CD7F32', era: 'roman_empire' },
    },
    {
      name: '丝绸之路织物',
      type: 'painting',
      description: '古代丝绸之路的珍贵织物展示',
      metadata: { width: 2, height: 3, color: '#8B4513' },
    },
  ],
  layout: [],
  lights: [
    {
      type: 'ambient',
      name: '环境光',
      color: '#F5E6D3',
      intensity: 0.4,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    {
      type: 'spot',
      name: '文物聚光灯 1',
      color: '#FFE4B5',
      intensity: 80,
      position: { x: -6, y: 5, z: -6 },
      rotation: { x: -0.8, y: 0, z: 0 },
      targetPosition: { x: -6, y: 0, z: -6 },
      angle: 0.5,
      penumbra: 0.5,
    },
    {
      type: 'spot',
      name: '文物聚光灯 2',
      color: '#FFE4B5',
      intensity: 80,
      position: { x: 6, y: 5, z: 6 },
      rotation: { x: -0.8, y: 0, z: 0 },
      targetPosition: { x: 6, y: 0, z: 6 },
      angle: 0.5,
      penumbra: 0.5,
    },
    {
      type: 'point',
      name: '暖色调辅助光',
      color: '#DEB887',
      intensity: 30,
      position: { x: 0, y: 5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      distance: 20,
    },
  ],
  tourPaths: [
    {
      name: '历史时光之旅',
      points: [
        { position: { x: 0, y: 3, z: -10 }, rotation: { x: 0, y: 0, z: 0 }, waitTime: 3000 },
        { position: { x: -8, y: 3, z: -8 }, rotation: { x: 0, y: 0.78, z: 0 }, waitTime: 4000 },
        { position: { x: -8, y: 3, z: 0 }, rotation: { x: 0, y: 1.57, z: 0 }, waitTime: 3000 },
        { position: { x: 0, y: 3, z: 8 }, rotation: { x: 0, y: Math.PI, z: 0 }, waitTime: 4000 },
        { position: { x: 8, y: 3, z: 0 }, rotation: { x: 0, y: -1.57, z: 0 }, waitTime: 3000 },
      ],
    },
  ],
};

export const overexposedGallery: PresetGallery = {
  gallery: {
    name: '灯光过曝展厅',
    description: '用于演示灯光过曝问题的展厅，包含问题场景和修复方案',
    presetType: 'overexposed',
    width: 20,
    depth: 20,
    height: 4,
  },
  exhibits: [
    {
      name: '高光测试雕塑',
      type: 'sculpture',
      description: '用于测试高光反射效果的金属雕塑',
      metadata: { color: '#C0C0C0', material: 'metallic' },
    },
    {
      name: '过曝画作',
      type: 'painting',
      description: '在强光下容易过曝的浅色画作',
      metadata: { width: 4, height: 3, color: '#FFFFFF' },
    },
    {
      name: '反光展柜',
      type: 'display_case',
      description: '高反光玻璃展柜',
      metadata: { width: 2, height: 1.5, depth: 1, reflectivity: 'high' },
    },
  ],
  layout: [],
  lights: [
    {
      type: 'ambient',
      name: '过强环境光',
      color: '#FFFFFF',
      intensity: 2.5,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    {
      type: 'point',
      name: '过强聚光灯 1',
      color: '#FFFFFF',
      intensity: 200,
      position: { x: -5, y: 3, z: -5 },
      rotation: { x: 0, y: 0, z: 0 },
      distance: 15,
    },
    {
      type: 'point',
      name: '过强聚光灯 2',
      color: '#FFFFFF',
      intensity: 200,
      position: { x: 5, y: 3, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      distance: 15,
    },
    {
      type: 'directional',
      name: '直射强光',
      color: '#FFFFFF',
      intensity: 3,
      position: { x: 0, y: 8, z: -10 },
      rotation: { x: -0.3, y: 0, z: 0 },
      targetPosition: { x: 0, y: 0, z: 0 },
    },
  ],
  tourPaths: [
    {
      name: '问题诊断路线',
      points: [
        { position: { x: 0, y: 2, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, waitTime: 2000 },
        { position: { x: -5, y: 2, z: -5 }, rotation: { x: 0, y: 0.78, z: 0 }, waitTime: 3000 },
        { position: { x: 0, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, waitTime: 4000 },
        { position: { x: 5, y: 2, z: 5 }, rotation: { x: 0, y: -0.78, z: 0 }, waitTime: 3000 },
      ],
    },
  ],
};

export const obstructedGallery: PresetGallery = {
  gallery: {
    name: '动线遮挡展厅',
    description: '用于演示参观动线遮挡问题的展厅，包含障碍物和优化方案',
    presetType: 'obstructed',
    width: 28,
    depth: 22,
    height: 5,
  },
  exhibits: [
    {
      name: '大型中心雕塑',
      type: 'sculpture',
      description: '放置在展厅中心的大型雕塑，可能遮挡视线',
      metadata: { color: '#8B4513', size: 'large' },
    },
    {
      name: '立柱展柜群',
      type: 'display_case',
      description: '沿墙面布置的展柜群',
      metadata: { width: 8, height: 2, depth: 1, arrangement: 'linear' },
    },
    {
      name: '角落画作',
      type: 'painting',
      description: '放置在角落的大型画作',
      metadata: { width: 6, height: 4, color: '#2F4F4F' },
    },
    {
      name: '障碍物装置',
      type: 'sculpture',
      description: '故意放置在动线上的障碍装置',
      metadata: { color: '#FF6347', isObstacle: true },
    },
  ],
  layout: [],
  lights: [
    {
      type: 'ambient',
      name: '环境光',
      color: '#E8E8E8',
      intensity: 0.5,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    {
      type: 'spot',
      name: '展品照明 1',
      color: '#FFFEF0',
      intensity: 60,
      position: { x: -8, y: 4, z: -6 },
      rotation: { x: -0.7, y: 0, z: 0 },
      targetPosition: { x: -8, y: 0, z: -6 },
      angle: 0.6,
      penumbra: 0.3,
    },
    {
      type: 'spot',
      name: '展品照明 2',
      color: '#FFFEF0',
      intensity: 60,
      position: { x: 8, y: 4, z: 6 },
      rotation: { x: -0.7, y: 0, z: 0 },
      targetPosition: { x: 8, y: 0, z: 6 },
      angle: 0.6,
      penumbra: 0.3,
    },
    {
      type: 'point',
      name: '警示照明',
      color: '#FF4500',
      intensity: 25,
      position: { x: 0, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      distance: 10,
    },
  ],
  tourPaths: [
    {
      name: '被遮挡的路线',
      points: [
        { position: { x: 0, y: 2.5, z: -9 }, rotation: { x: 0, y: 0, z: 0 }, waitTime: 2000 },
        { position: { x: 0, y: 2.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, waitTime: 4000 },
        { position: { x: 0, y: 2.5, z: 9 }, rotation: { x: 0, y: Math.PI, z: 0 }, waitTime: 2000 },
      ],
    },
    {
      name: '优化绕行路线',
      points: [
        { position: { x: 0, y: 2.5, z: -9 }, rotation: { x: 0, y: 0, z: 0 }, waitTime: 2000 },
        { position: { x: -10, y: 2.5, z: -6 }, rotation: { x: 0, y: 0.5, z: 0 }, waitTime: 3000 },
        { position: { x: -10, y: 2.5, z: 0 }, rotation: { x: 0, y: 1.57, z: 0 }, waitTime: 2000 },
        { position: { x: -10, y: 2.5, z: 6 }, rotation: { x: 0, y: 2.6, z: 0 }, waitTime: 3000 },
        { position: { x: 0, y: 2.5, z: 9 }, rotation: { x: 0, y: Math.PI, z: 0 }, waitTime: 2000 },
      ],
    },
  ],
};

export const presetGalleries: Record<string, PresetGallery> = {
  modern: modernArtGallery,
  ancient: ancientGallery,
  overexposed: overexposedGallery,
  obstructed: obstructedGallery,
};
