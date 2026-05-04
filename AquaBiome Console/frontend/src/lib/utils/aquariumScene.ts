import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  HemisphericLight, 
  Vector3, 
  Color3, 
  Color4,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Animation,
  AnimationGroup,
  EasingFunction,
  SineEase,
  EasingMode,
  ParticleSystem,
  PointParticleEmitter,
  ColorGradient,
  SizeGradient,
  DefaultRenderingPipeline,
  FresnelParameters,
  PBRMaterial,
  Mesh,
  TransformNode,
  Nullable
} from '@babylonjs/core';
import '@babylonjs/loaders';
import '@babylonjs/materials';

import type { SceneConfig, WaterParameters, Device } from '$lib/types';

export interface AquariumScene {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  tank: TransformNode;
  water: Mesh;
  fish: TransformNode[];
  bubbles: ParticleSystem[];
  algaeParticles: Nullable<ParticleSystem>;
  foodParticles: Nullable<ParticleSystem>;
  animationGroups: AnimationGroup[];
  pipeline: DefaultRenderingPipeline;
}

export function createAquariumScene(canvas: HTMLCanvasElement): AquariumScene {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.02, 0.05, 0.1, 1);

  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 4,
    Math.PI / 3,
    12,
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 20;
  camera.wheelPrecision = 50;

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;
  light.diffuse = new Color3(0.8, 0.9, 1);
  light.groundColor = new Color3(0.2, 0.3, 0.4);

  const pipeline = new DefaultRenderingPipeline('pipeline', true, scene, [camera]);
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.9;
  pipeline.bloomWeight = 0.3;
  pipeline.bloomKernel = 64;

  const tank = new TransformNode('tank', scene);

  const glassMaterial = new PBRMaterial('glassMaterial', scene);
  glassMaterial.albedoColor = new Color3(0.95, 0.98, 1);
  glassMaterial.metallic = 0.1;
  glassMaterial.roughness = 0.1;
  glassMaterial.indexOfRefraction = 1.5;
  glassMaterial.subSurface.isRefractionEnabled = true;
  glassMaterial.subSurface.refractionIntensity = 0.8;

  const waterMaterial = new PBRMaterial('waterMaterial', scene);
  waterMaterial.albedoColor = new Color3(0.1, 0.4, 0.7);
  waterMaterial.metallic = 0;
  waterMaterial.roughness = 0.2;
  waterMaterial.subSurface.isRefractionEnabled = true;
  waterMaterial.subSurface.refractionIntensity = 0.3;

  const tankBack = MeshBuilder.CreateBox('tankBack', { width: 10, height: 6, depth: 0.1 }, scene);
  tankBack.position = new Vector3(0, 0, -2.45);
  tankBack.parent = tank;
  tankBack.material = glassMaterial;

  const tankFront = MeshBuilder.CreateBox('tankFront', { width: 10, height: 6, depth: 0.1 }, scene);
  tankFront.position = new Vector3(0, 0, 2.45);
  tankFront.parent = tank;
  tankFront.material = glassMaterial;

  const tankLeft = MeshBuilder.CreateBox('tankLeft', { width: 0.1, height: 6, depth: 5 }, scene);
  tankLeft.position = new Vector3(-4.95, 0, 0);
  tankLeft.parent = tank;
  tankLeft.material = glassMaterial;

  const tankRight = MeshBuilder.CreateBox('tankRight', { width: 0.1, height: 6, depth: 5 }, scene);
  tankRight.position = new Vector3(4.95, 0, 0);
  tankRight.parent = tank;
  tankRight.material = glassMaterial;

  const tankBottom = MeshBuilder.CreateBox('tankBottom', { width: 10, height: 0.1, depth: 5 }, scene);
  tankBottom.position = new Vector3(0, -2.95, 0);
  tankBottom.parent = tank;
  tankBottom.material = glassMaterial;

  const sandMaterial = new StandardMaterial('sandMaterial', scene);
  sandMaterial.diffuseColor = new Color3(0.82, 0.75, 0.6);
  sandMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

  const sand = MeshBuilder.CreateBox('sand', { width: 9.8, height: 0.3, depth: 4.8 }, scene);
  sand.position = new Vector3(0, -2.8, 0);
  sand.parent = tank;
  sand.material = sandMaterial;

  const water = MeshBuilder.CreateBox('water', { width: 9.9, height: 5.8, depth: 4.9 }, scene);
  water.position = new Vector3(0, 0, 0);
  water.parent = tank;
  water.material = waterMaterial;

  createCorals(scene, tank);
  createRocks(scene, tank);

  const fish: TransformNode[] = [];
  const bubbles: ParticleSystem[] = [];
  const animationGroups: AnimationGroup[] = [];

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });

  return {
    engine,
    scene,
    camera,
    tank,
    water,
    fish,
    bubbles,
    algaeParticles: null,
    foodParticles: null,
    animationGroups,
    pipeline
  };
}

function createCorals(scene: Scene, parent: TransformNode) {
  const coralColors = [
    new Color3(1, 0.4, 0.5),
    new Color3(0.3, 0.8, 0.6),
    new Color3(0.9, 0.6, 0.3),
    new Color3(0.5, 0.3, 0.8),
    new Color3(0.9, 0.3, 0.6)
  ];

  const positions = [
    { pos: new Vector3(-3, -2.5, -1.5), scale: 0.8 },
    { pos: new Vector3(2, -2.5, -1), scale: 1.0 },
    { pos: new Vector3(-2, -2.5, 1), scale: 0.6 },
    { pos: new Vector3(3.5, -2.5, 0.5), scale: 0.7 },
    { pos: new Vector3(0, -2.5, -2), scale: 0.9 }
  ];

  positions.forEach((pos, index) => {
    const coral = createCoralMesh(scene, coralColors[index % coralColors.length]);
    coral.position = pos.pos;
    coral.scaling = new Vector3(pos.scale, pos.scale, pos.scale);
    coral.parent = parent;
  });
}

function createCoralMesh(scene: Scene, color: Color3): Mesh {
  const coral = new TransformNode('coral', scene);
  
  const material = new PBRMaterial('coralMaterial', scene);
  material.albedoColor = color;
  material.metallic = 0.2;
  material.roughness = 0.8;

  const base = MeshBuilder.CreateCylinder('base', { height: 0.5, diameterTop: 0.3, diameterBottom: 0.5 }, scene);
  base.position.y = 0.25;
  base.material = material;
  base.parent = coral;

  for (let i = 0; i < 5; i++) {
    const branch = MeshBuilder.CreateCylinder(`branch${i}`, { height: 1 + Math.random(), diameterTop: 0.1, diameterBottom: 0.2 }, scene);
    branch.position.y = 0.5 + Math.random() * 0.5;
    branch.position.x = (Math.random() - 0.5) * 0.5;
    branch.position.z = (Math.random() - 0.5) * 0.5;
    branch.rotation.x = (Math.random() - 0.5) * 0.5;
    branch.rotation.z = (Math.random() - 0.5) * 0.5;
    branch.material = material;
    branch.parent = coral;
  }

  return coral as Mesh;
}

function createRocks(scene: Scene, parent: TransformNode) {
  const rockMaterial = new PBRMaterial('rockMaterial', scene);
  rockMaterial.albedoColor = new Color3(0.3, 0.35, 0.4);
  rockMaterial.metallic = 0.1;
  rockMaterial.roughness = 0.9;

  const rockPositions = [
    { pos: new Vector3(-4, -2.6, -1), scale: 0.8 },
    { pos: new Vector3(4, -2.6, 1.5), scale: 0.6 },
    { pos: new Vector3(0, -2.6, 2), scale: 0.5 }
  ];

  rockPositions.forEach((pos, index) => {
    const rock = MeshBuilder.CreateTorusKnot(`rock${index}`, { radius: 0.5, tube: 0.2 }, scene);
    rock.position = pos.pos;
    rock.scaling = new Vector3(pos.scale, pos.scale, pos.scale);
    rock.rotation = new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.material = rockMaterial;
    rock.parent = parent;
  });
}

export function updateSceneFromConfig(aquarium: AquariumScene, config: SceneConfig) {
  const { scene, water, bubbles, algaeParticles, pipeline } = aquarium;

  const waterMaterial = water.material as PBRMaterial;
  const clarityFactor = config.waterClarity / 100;
  
  waterMaterial.albedoColor = new Color3(
    config.waterColor.r * (0.5 + 0.5 * clarityFactor),
    config.waterColor.g * (0.5 + 0.5 * clarityFactor),
    config.waterColor.b * (0.5 + 0.5 * clarityFactor)
  );
  
  waterMaterial.subSurface.refractionIntensity = 0.1 + 0.3 * clarityFactor;
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogStart = 5;
  scene.fogEnd = 15 - 10 * clarityFactor;
  scene.fogColor = new Color3(
    config.waterColor.r * 0.3,
    config.waterColor.g * 0.3,
    config.waterColor.b * 0.5
  );

  if (config.deviceStatuses.airPump === 'running') {
    if (bubbles.length === 0) {
      createBubbleSystem(aquarium);
    }
    bubbles.forEach(bubble => {
      bubble.maxScaleX = 0.05 + 0.1 * (config.oxygenLevel / 10);
      bubble.maxScaleY = 0.05 + 0.1 * (config.oxygenLevel / 10);
      bubble.maxScaleZ = 0.05 + 0.1 * (config.oxygenLevel / 10);
      if (!bubble.isStarted()) {
        bubble.start();
      }
    });
  } else {
    bubbles.forEach(bubble => {
      if (bubble.isStarted()) {
        bubble.stop();
      }
    });
  }

  if (config.algaeLevel > 30) {
    if (!algaeParticles) {
      createAlgaeSystem(aquarium);
    }
    if (aquarium.algaeParticles) {
      const algaeIntensity = config.algaeLevel / 100;
      aquarium.algaeParticles.maxScaleX = 0.1 * algaeIntensity;
      aquarium.algaeParticles.maxScaleY = 0.1 * algaeIntensity;
      aquarium.algaeParticles.emitRate = 50 * algaeIntensity;
      if (!aquarium.algaeParticles.isStarted()) {
        aquarium.algaeParticles.start();
      }
    }
  } else if (aquarium.algaeParticles) {
    if (aquarium.algaeParticles.isStarted()) {
      aquarium.algaeParticles.stop();
    }
  }

  pipeline.bloomEnabled = config.lightingIntensity > 50;
  pipeline.bloomWeight = 0.1 + 0.3 * (config.lightingIntensity / 100);
}

export function createFish(aquarium: AquariumScene, count: number) {
  const { scene, fish } = aquarium;

  while (fish.length < count) {
    const fishNode = createSingleFish(scene, fish.length);
    fish.push(fishNode);
  }

  while (fish.length > count) {
    const removed = fish.pop();
    if (removed) {
      removed.dispose();
    }
  }

  animateFish(aquarium);
}

function createSingleFish(scene: Scene, index: number): TransformNode {
  const fishColors = [
    { body: new Color3(1, 0.5, 0), tail: new Color3(1, 0.3, 0) },
    { body: new Color3(0.2, 0.6, 1), tail: new Color3(0.1, 0.4, 0.9) },
    { body: new Color3(1, 0.8, 0), tail: new Color3(0.9, 0.6, 0) },
    { body: new Color3(0.8, 0.2, 0.6), tail: new Color3(0.6, 0.1, 0.4) },
    { body: new Color3(0.2, 0.8, 0.5), tail: new Color3(0.1, 0.6, 0.3) }
  ];

  const color = fishColors[index % fishColors.length];
  const fish = new TransformNode(`fish_${index}`, scene);

  const bodyMaterial = new PBRMaterial(`fishBody_${index}`, scene);
  bodyMaterial.albedoColor = color.body;
  bodyMaterial.metallic = 0.3;
  bodyMaterial.roughness = 0.4;

  const tailMaterial = new PBRMaterial(`fishTail_${index}`, scene);
  tailMaterial.albedoColor = color.tail;
  tailMaterial.metallic = 0.2;
  tailMaterial.roughness = 0.5;

  const body = MeshBuilder.CreateSphere(`body_${index}`, { diameter: 0.4, segments: 16 }, scene);
  body.scaling = new Vector3(2, 1, 1.2);
  body.material = bodyMaterial;
  body.parent = fish;

  const tail = MeshBuilder.CreateCylinder(`tail_${index}`, { height: 0.3, diameterTop: 0, diameterBottom: 0.3 }, scene);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.5;
  tail.scaling.y = 1.5;
  tail.material = tailMaterial;
  tail.parent = fish;

  const eyeMaterial = new PBRMaterial(`eye_${index}`, scene);
  eyeMaterial.albedoColor = new Color3(0.1, 0.1, 0.1);
  eyeMaterial.metallic = 0.8;
  eyeMaterial.roughness = 0.2;

  const eye1 = MeshBuilder.CreateSphere(`eye1_${index}`, { diameter: 0.08 }, scene);
  eye1.position = new Vector3(0.3, 0.1, 0.15);
  eye1.material = eyeMaterial;
  eye1.parent = fish;

  const eye2 = MeshBuilder.CreateSphere(`eye2_${index}`, { diameter: 0.08 }, scene);
  eye2.position = new Vector3(0.3, 0.1, -0.15);
  eye2.material = eyeMaterial;
  eye2.parent = fish;

  const startX = (Math.random() - 0.5) * 8;
  const startY = (Math.random() - 0.5) * 4 - 0.5;
  const startZ = (Math.random() - 0.5) * 4;
  fish.position = new Vector3(startX, startY, startZ);

  return fish;
}

function animateFish(aquarium: AquariumScene) {
  const { scene, fish, animationGroups } = aquarium;

  animationGroups.forEach(ag => ag.dispose());
  animationGroups.length = 0;

  fish.forEach((fishNode, index) => {
    const animationGroup = new AnimationGroup(`fishAnimation_${index}`, scene);

    const frameRate = 30;
    const swimSpeed = 2 + Math.random() * 3;
    const swimDuration = 5 + Math.random() * 5;

    const posAnimX = new Animation(
      `posX_${index}`,
      'position.x',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const posAnimY = new Animation(
      `posY_${index}`,
      'position.y',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const posAnimZ = new Animation(
      `posZ_${index}`,
      'position.z',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const rotAnimY = new Animation(
      `rotY_${index}`,
      'rotation.y',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const tailAnimZ = new Animation(
      `tailRotZ_${index}`,
      'rotation.z',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const easingFunction = new SineEase();
    easingFunction.setEasingMode(EasingMode.EASEINOUT);

    const startPos = fishNode.position.clone();
    const pathRadius = 2 + Math.random() * 2;
    const verticalAmplitude = 0.5 + Math.random() * 0.5;

    const keyFramesX: Array<{ frame: number; value: number }> = [];
    const keyFramesY: Array<{ frame: number; value: number }> = [];
    const keyFramesZ: Array<{ frame: number; value: number }> = [];
    const keyFramesRotY: Array<{ frame: number; value: number }> = [];

    for (let i = 0; i <= frameRate * swimDuration; i += frameRate * 0.5) {
      const t = i / (frameRate * swimDuration);
      const angle = t * Math.PI * 2 * swimSpeed;
      
      keyFramesX.push({
        frame: i,
        value: startPos.x + Math.sin(angle) * pathRadius
      });
      
      keyFramesY.push({
        frame: i,
        value: startPos.y + Math.sin(angle * 2) * verticalAmplitude
      });
      
      keyFramesZ.push({
        frame: i,
        value: startPos.z + Math.cos(angle) * pathRadius
      });

      keyFramesRotY.push({
        frame: i,
        value: Math.atan2(
          Math.cos(angle) * pathRadius,
          Math.sin(angle) * pathRadius
        ) + Math.PI / 2
      });
    }

    posAnimX.setKeys(keyFramesX);
    posAnimY.setKeys(keyFramesY);
    posAnimZ.setKeys(keyFramesZ);
    rotAnimY.setKeys(keyFramesRotY);

    const tailKeyFrames = [
      { frame: 0, value: 0 },
      { frame: frameRate / 4, value: 0.3 },
      { frame: frameRate / 2, value: 0 },
      { frame: frameRate * 3 / 4, value: -0.3 },
      { frame: frameRate, value: 0 }
    ];
    tailAnimZ.setKeys(tailKeyFrames);

    animationGroup.addTargetedAnimation(posAnimX, fishNode);
    animationGroup.addTargetedAnimation(posAnimY, fishNode);
    animationGroup.addTargetedAnimation(posAnimZ, fishNode);
    animationGroup.addTargetedAnimation(rotAnimY, fishNode);

    const tail = fishNode.getChildren().find(c => c.name.startsWith('tail_'));
    if (tail) {
      animationGroup.addTargetedAnimation(tailAnimZ, tail);
    }

    animationGroup.play(true);
    animationGroup.speedRatio = 1 + index * 0.1;

    animationGroups.push(animationGroup);
  });
}

export function createBubbleSystem(aquarium: AquariumScene) {
  const { scene, bubbles, tank } = aquarium;

  if (bubbles.length > 0) return;

  const bubblePositions = [
    new Vector3(-3, -2.8, -1),
    new Vector3(3, -2.8, 1),
    new Vector3(0, -2.8, 0)
  ];

  bubblePositions.forEach((pos, index) => {
    const bubbleSystem = new ParticleSystem(`bubbleSystem_${index}`, 100, scene);
    
    bubbleSystem.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP4//8/AwMDAwMDACX9Bf+zAAAAAElFTkSuQmCC', scene);
    
    const emitter = new PointParticleEmitter();
    emitter.direction1 = new Vector3(-0.1, 1, -0.1);
    emitter.direction2 = new Vector3(0.1, 1, 0.1);
    bubbleSystem.particleEmitterType = emitter;

    bubbleSystem.emitter = pos.clone();
    bubbleSystem.minEmitBox = new Vector3(-0.1, 0, -0.1);
    bubbleSystem.maxEmitBox = new Vector3(0.1, 0, 0.1);

    bubbleSystem.color1 = new Color4(0.8, 0.9, 1, 0.8);
    bubbleSystem.color2 = new Color4(0.9, 0.95, 1, 0.6);
    bubbleSystem.colorDead = new Color4(1, 1, 1, 0);

    bubbleSystem.minSize = 0.02;
    bubbleSystem.maxSize = 0.08;

    bubbleSystem.minLifeTime = 2;
    bubbleSystem.maxLifeTime = 4;

    bubbleSystem.emitRate = 30;

    bubbleSystem.minEmitPower = 1;
    bubbleSystem.maxEmitPower = 2;
    bubbleSystem.updateSpeed = 0.01;

    bubbleSystem.gravity = new Vector3(0, 0.5, 0);

    bubbleSystem.start();
    bubbleSystem.parent = tank;
    bubbles.push(bubbleSystem);
  });
}

export function createAlgaeSystem(aquarium: AquariumScene) {
  const { scene, tank } = aquarium;

  const algaeSystem = new ParticleSystem('algaeSystem', 500, scene);
  
  algaeSystem.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP4//8/AwMDAwMDACX9Bf+zAAAAAElFTkSuQmCC', scene);

  algaeSystem.emitter = new Vector3(0, 0, 0);
  algaeSystem.minEmitBox = new Vector3(-4.5, -2.5, -2.2);
  algaeSystem.maxEmitBox = new Vector3(4.5, 2.5, 2.2);

  algaeSystem.color1 = new Color4(0.2, 0.6, 0.2, 0.6);
  algaeSystem.color2 = new Color4(0.3, 0.7, 0.3, 0.4);
  algaeSystem.colorDead = new Color4(0.1, 0.4, 0.1, 0);

  algaeSystem.minSize = 0.05;
  algaeSystem.maxSize = 0.2;

  algaeSystem.minLifeTime = 5;
  algaeSystem.maxLifeTime = 10;

  algaeSystem.emitRate = 20;

  algaeSystem.minEmitPower = 0.1;
  algaeSystem.maxEmitPower = 0.3;
  algaeSystem.updateSpeed = 0.005;

  algaeSystem.gravity = new Vector3(0, -0.05, 0);

  algaeSystem.preWarmCycles = 10;
  algaeSystem.preWarmStepOffset = 5;

  algaeSystem.parent = tank;
  aquarium.algaeParticles = algaeSystem;
}

export function createFoodSystem(aquarium: AquariumScene) {
  const { scene, tank } = aquarium;

  const foodSystem = new ParticleSystem('foodSystem', 100, scene);
  
  foodSystem.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP4//8/AwMDAwMDACX9Bf+zAAAAAElFTkSuQmCC', scene);

  foodSystem.emitter = new Vector3(0, 3, 0);
  foodSystem.minEmitBox = new Vector3(-2, 0, -1);
  foodSystem.maxEmitBox = new Vector3(2, 0, 1);

  foodSystem.color1 = new Color4(0.9, 0.7, 0.3, 0.9);
  foodSystem.color2 = new Color4(0.8, 0.6, 0.2, 0.7);
  foodSystem.colorDead = new Color4(0.5, 0.4, 0.1, 0);

  foodSystem.minSize = 0.02;
  foodSystem.maxSize = 0.05;

  foodSystem.minLifeTime = 3;
  foodSystem.maxLifeTime = 6;

  foodSystem.emitRate = 0;

  foodSystem.minEmitPower = 0.5;
  foodSystem.maxEmitPower = 1;
  foodSystem.updateSpeed = 0.01;

  foodSystem.gravity = new Vector3(0, -1, 0);

  foodSystem.parent = tank;
  aquarium.foodParticles = foodSystem;

  return foodSystem;
}

export function triggerFeeding(aquarium: AquariumScene) {
  if (!aquarium.foodParticles) {
    createFoodSystem(aquarium);
  }

  const foodSystem = aquarium.foodParticles;
  if (foodSystem) {
    foodSystem.emitRate = 50;
    foodSystem.start();

    setTimeout(() => {
      foodSystem.emitRate = 0;
    }, 2000);

    setTimeout(() => {
      if (foodSystem.isStarted()) {
        foodSystem.stop();
      }
    }, 8000);
  }
}

export function getSceneConfigFromState(
  waterParams: any,
  devices: any[]
): SceneConfig {
  const clarity = waterParams?.clarity ?? 100;
  const algaeLevel = waterParams?.algae_level ?? 0;
  const oxygenLevel = waterParams?.oxygen ?? 8;
  const temperature = waterParams?.temperature ?? 25;

  let waterColor = { r: 0.1, g: 0.4, b: 0.7 };
  
  if (algaeLevel > 50) {
    waterColor = { r: 0.1 + algaeLevel / 200, g: 0.4 + algaeLevel / 100, b: 0.1 };
  } else if (oxygenLevel < 5) {
    waterColor = { r: 0.3, g: 0.3, b: 0.5 };
  } else if (clarity < 50) {
    waterColor = { r: 0.2, g: 0.25, b: 0.3 };
  }

  const getDeviceStatus = (type: string): 'running' | 'stopped' | 'malfunction' => {
    const device = devices.find(d => d.type === type);
    return (device?.status as 'running' | 'stopped' | 'malfunction') ?? 'running';
  };

  const lightDevice = devices.find(d => d.type === 'light');
  const lightingIntensity = lightDevice?.power ?? 100;

  return {
    waterClarity: clarity,
    waterColor,
    algaeLevel,
    oxygenLevel,
    lightingIntensity,
    deviceStatuses: {
      filter: getDeviceStatus('filter'),
      airPump: getDeviceStatus('air_pump'),
      heater: getDeviceStatus('heater'),
      light: getDeviceStatus('light')
    }
  };
}

export function disposeScene(aquarium: AquariumScene) {
  aquarium.engine.dispose();
}
