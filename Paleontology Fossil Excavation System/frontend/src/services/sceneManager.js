import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

class FossilSceneManager {
  constructor() {
    this.engine = null;
    this.scene = null;
    this.canvas = null;
    this.camera = null;
    this.layers = [];
    this.fragments = [];
    this.particleSystems = [];
    this.animations = {};
    this.currentLayer = 0;
    this.selectedFragment = null;
    this.isSceneReady = false;
    this.onFragmentSelect = null;
    this.onLayerChange = null;
    this.excavationProgress = {};
  }

  init(canvas) {
    this.canvas = canvas;
    this.engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.05, 0.08, 0.12, 1);
    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.03;
    this.scene.fogColor = new BABYLON.Color3(0.05, 0.08, 0.12);

    this.createCamera();
    this.createLights();
    this.createEnvironment();

    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
        this.handlePointerPick(pointerInfo);
      }
    });

    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.updateAnimations();
    });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    this.isSceneReady = true;
    return this;
  }

  createCamera() {
    this.camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      15,
      BABYLON.Vector3.Zero(),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 30;
    this.camera.upperBetaLimit = Math.PI / 2.1;
    this.camera.lowerBetaLimit = Math.PI / 6;
    this.camera.wheelPrecision = 20;
    this.camera.inertia = 0.9;
  }

  createLights() {
    const ambient = new BABYLON.HemisphericLight(
      'ambient',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    ambient.intensity = 0.4;
    ambient.diffuse = new BABYLON.Color3(0.9, 0.95, 1);
    ambient.groundColor = new BABYLON.Color3(0.2, 0.25, 0.3);

    const sun = new BABYLON.DirectionalLight(
      'sun',
      new BABYLON.Vector3(-0.5, -1, -0.5),
      this.scene
    );
    sun.position = new BABYLON.Vector3(20, 40, 20);
    sun.intensity = 0.8;

    const pointLight = new BABYLON.PointLight(
      'point',
      new BABYLON.Vector3(0, 10, 0),
      this.scene
    );
    pointLight.intensity = 0.5;
  }

  createEnvironment() {
    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: 100, height: 100 },
      this.scene
    );
    const groundMat = new BABYLON.StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.1, 0.12, 0.1);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;
    ground.position.y = -1;
  }

  async loadStratigraphicLayers(layers) {
    this.clearLayers();

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerMesh = this.createStratumLayer(layer, i);
      this.layers.push({
        mesh: layerMesh,
        data: layer,
        index: i,
        excavated: 0,
        originalOpacity: 1
      });
    }

    this.arrangeLayers();
  }

  createStratumLayer(layer, index) {
    const depth = 2;
    const width = 12;
    const height = 10;

    const box = BABYLON.MeshBuilder.CreateBox(
      `layer_${index}`,
      {
        width: width,
        height: depth,
        depth: height
      },
      this.scene
    );

    const mat = new BABYLON.StandardMaterial(`layerMat_${index}`, this.scene);
    const color = this.hexToColor3(layer.color);
    mat.diffuseColor = color;
    mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    mat.emissiveColor = color.scale(0.1);

    box.material = mat;

    box.enableEdgesRendering();
    box.edgesWidth = 0.5;
    box.edgesColor = new BABYLON.Color4(
      color.r * 0.5,
      color.g * 0.5,
      color.b * 0.5,
      0.5
    );

    this.addRockNoise(box, index);

    return box;
  }

  addRockNoise(mesh, index) {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const noiseScale = 0.05;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += (Math.random() - 0.5) * noiseScale;
      positions[i + 1] += (Math.random() - 0.5) * noiseScale;
      positions[i + 2] += (Math.random() - 0.5) * noiseScale;
    }

    mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
  }

  arrangeLayers() {
    const totalHeight = this.layers.reduce((sum, layer) => sum + 2, 0);
    let currentY = totalHeight / 2 - 1;

    for (const layer of this.layers) {
      layer.mesh.position.y = currentY;
      currentY -= 2;
    }
  }

  async excavateLayer(layerIndex, callback) {
    if (layerIndex < 0 || layerIndex >= this.layers.length) return;

    const layer = this.layers[layerIndex];
    if (layer.excavated >= 1) return;

    await this.playExcavationAnimation(layer, callback);
    layer.excavated = 1;

    if (this.onLayerChange) {
      this.onLayerChange(layerIndex, layer.data);
    }
  }

  async playExcavationAnimation(layer, callback) {
    const mesh = layer.mesh;
    const originalPos = mesh.position.clone();
    const startTime = Date.now();
    const duration = 2000;

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = 1 - Math.pow(1 - progress, 3);
        mesh.position.y = originalPos.y + eased * 5;
        mesh.material.alpha = 1 - eased;

        if (progress < 0.3) {
          this.createExcavationParticles(mesh.position, layer.data.color);
        }

        if (callback) callback(eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          mesh.setEnabled(false);
          resolve();
        }
      };
      animate();
    });
  }

  createExcavationParticles(position, colorHex) {
    const particleSystem = new BABYLON.ParticleSystem(
      'excavation_particles',
      100,
      this.scene
    );

    const color = this.hexToColor3(colorHex);
    particleSystem.emitter = new BABYLON.Vector3(
      position.x + (Math.random() - 0.5) * 10,
      position.y,
      position.z + (Math.random() - 0.5) * 8
    );

    particleSystem.particleTexture = this.createParticleTexture();
    particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
    particleSystem.color2 = new BABYLON.Color4(color.r * 0.7, color.g * 0.7, color.b * 0.7, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(0.2, 0.15, 0.1, 0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.4;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 2;
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.025;

    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-1, 2, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 4, 1);

    particleSystem.emitRate = 20;
    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 2000);
    }, 500);
  }

  createParticleTexture() {
    const texture = new BABYLON.DynamicTexture('particleTex', 16, this.scene);
    const ctx = texture.getContext();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    texture.update();
    return texture;
  }

  async loadFragments(fragmentsData) {
    this.clearFragments();

    for (const data of fragmentsData) {
      const fragment = this.createFragment(data);
      this.fragments.push(fragment);
    }
  }

  createFragment(data) {
    const mesh = this.createBoneMesh(data.bone_type, data.name);

    const pos = [
      data.position_x + (data.coordinate_error_x || 0),
      data.position_y + (data.coordinate_error_y || 0),
      data.position_z + (data.coordinate_error_z || 0)
    ];

    mesh.position = new BABYLON.Vector3(pos[0], pos[1], pos[2]);
    mesh.rotation = new BABYLON.Vector3(
      (data.rotation_x || 0) * Math.PI / 180,
      (data.rotation_y || 0) * Math.PI / 180,
      (data.rotation_z || 0) * Math.PI / 180
    );

    const scale = 0.6 + Math.random() * 0.4;
    mesh.scaling = new BABYLON.Vector3(
      (data.scale_x || 1) * scale,
      (data.scale_y || 1) * scale,
      (data.scale_z || 1) * scale
    );

    const mat = this.createBoneMaterial(data);
    mesh.material = mat;

    mesh.setEnabled(data.discovered === 1);

    return {
      mesh,
      data: { ...data },
      isHighlighted: false,
      isDiscovered: data.discovered === 1,
      originalMaterial: mat
    };
  }

  createBoneMesh(boneType, name) {
    let mesh;

    switch (boneType) {
      case 'skull':
        mesh = BABYLON.MeshBuilder.CreateSphere(
          name,
          { diameterX: 1.5, diameterY: 1.2, diameterZ: 1.8 },
          this.scene
        );
        break;
      case 'vertebra':
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          name,
          { diameter: 0.6, height: 0.4, tessellation: 8 },
          this.scene
        );
        break;
      case 'limb':
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          name,
          { diameter: 0.4, height: 1.8, tessellation: 6 },
          this.scene
        );
        break;
      case 'rib':
        mesh = BABYLON.MeshBuilder.CreateTorus(
          name,
          { diameter: 1, thickness: 0.12, tessellation: 16 },
          this.scene
        );
        mesh.rotation.z = Math.PI / 4;
        break;
      case 'pelvis':
        mesh = BABYLON.MeshBuilder.CreateBox(
          name,
          { width: 1.5, height: 0.8, depth: 1.2 },
          this.scene
        );
        break;
      case 'tooth':
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          name,
          { diameterTop: 0.05, diameterBottom: 0.2, height: 0.6 },
          this.scene
        );
        break;
      case 'tusk':
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          name,
          { diameter: 0.2, height: 2.5, tessellation: 12 },
          this.scene
        );
        break;
      default:
        mesh = BABYLON.MeshBuilder.CreateBox(
          name,
          { width: 0.5, height: 0.5, depth: 0.8 },
          this.scene
        );
    }

    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (positions) {
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += (Math.random() - 0.5) * 0.05;
        positions[i + 1] += (Math.random() - 0.5) * 0.05;
        positions[i + 2] += (Math.random() - 0.5) * 0.05;
      }
      mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    }

    return mesh;
  }

  createBoneMaterial(fragmentData) {
    const mat = new BABYLON.StandardMaterial(`bone_${fragmentData.id}`, this.scene);

    const baseColor = new BABYLON.Color3(0.95, 0.9, 0.8);
    const erosion = fragmentData.erosion_level || 0;
    const weathering = fragmentData.weathering_level || 0;

    const damagedColor = new BABYLON.Color3(
      0.7 - erosion * 0.3,
      0.6 - erosion * 0.3,
      0.5 - erosion * 0.3
    );

    mat.diffuseColor = BABYLON.Color3.Lerp(baseColor, damagedColor, erosion);
    mat.specularColor = new BABYLON.Color3(
      0.3 * (1 - weathering),
      0.3 * (1 - weathering),
      0.25 * (1 - weathering)
    );
    mat.specularPower = 10 * (1 - weathering);

    if (weathering > 0.5) {
      mat.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0.15).scale(weathering * 0.3);
    }

    return mat;
  }

  discoverFragment(fragmentIndex) {
    if (fragmentIndex < 0 || fragmentIndex >= this.fragments.length) return;

    const fragment = this.fragments[fragmentIndex];
    if (!fragment.isDiscovered) {
      fragment.isDiscovered = true;
      fragment.mesh.setEnabled(true);
      this.playDiscoveryAnimation(fragment);
      this.highlightFragment(fragmentIndex);
    }
  }

  playDiscoveryAnimation(fragment) {
    const mesh = fragment.mesh;
    const originalScale = mesh.scaling.clone();
    const originalRotation = mesh.rotation.clone();

    mesh.scaling = BABYLON.Vector3.Zero();
    mesh.rotation = new BABYLON.Vector3(0, 0, 0);

    const startTime = Date.now();
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);

      mesh.scaling = BABYLON.Vector3.Lerp(BABYLON.Vector3.Zero(), originalScale, eased);
      mesh.rotation = BABYLON.Vector3.Lerp(
        new BABYLON.Vector3(0, Math.PI * 2, 0),
        originalRotation,
        eased
      );

      this.createDiscoveryParticles(mesh.position);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.startHighlightPulse(fragment);
      }
    };

    animate();
  }

  createDiscoveryParticles(position) {
    const particleSystem = new BABYLON.ParticleSystem(
      'discovery_particles',
      50,
      this.scene
    );

    particleSystem.emitter = position.clone();
    particleSystem.particleTexture = this.createParticleTexture();
    particleSystem.color1 = new BABYLON.Color4(1, 0.9, 0.6, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.7, 0.3, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(1, 0.5, 0.1, 0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.8;
    particleSystem.emitRate = 30;

    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 3, 1);

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 1000);
    }, 300);
  }

  highlightFragment(fragmentIndex) {
    if (this.selectedFragment !== null) {
      this.removeHighlight(this.fragments[this.selectedFragment]);
    }

    if (fragmentIndex < 0 || fragmentIndex >= this.fragments.length) {
      this.selectedFragment = null;
      return;
    }

    this.selectedFragment = fragmentIndex;
    const fragment = this.fragments[fragmentIndex];
    this.addHighlight(fragment);

    if (this.onFragmentSelect) {
      this.onFragmentSelect(fragment.data);
    }
  }

  addHighlight(fragment) {
    const highlightMat = new BABYLON.StandardMaterial('highlightMat', this.scene);
    highlightMat.emissiveColor = new BABYLON.Color3(0.3, 0.8, 1);
    highlightMat.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
    highlightMat.alpha = 0.8;

    const highlightMesh = fragment.mesh.clone('highlight_' + fragment.mesh.name);
    highlightMesh.material = highlightMat;
    highlightMesh.scaling = fragment.mesh.scaling.scale(1.1);
    highlightMesh.isPickable = false;

    fragment.highlightMesh = highlightMesh;
    fragment.isHighlighted = true;
  }

  removeHighlight(fragment) {
    if (fragment.highlightMesh) {
      fragment.highlightMesh.dispose();
      fragment.highlightMesh = null;
    }
    fragment.isHighlighted = false;
  }

  startHighlightPulse(fragment) {
    const highlightMat = new BABYLON.StandardMaterial('pulseMat', this.scene);
    highlightMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.4);
    highlightMat.alpha = 0;

    const pulseMesh = fragment.mesh.clone('pulse_' + fragment.mesh.name);
    pulseMesh.material = highlightMat;
    pulseMesh.scaling = fragment.mesh.scaling.clone();
    pulseMesh.isPickable = false;

    fragment.pulseMesh = pulseMesh;
    fragment.pulseStartTime = Date.now();
    fragment.pulseDuration = 2000;
    fragment.pulseCount = 3;
  }

  updateAnimations() {
    const now = Date.now();

    for (const fragment of this.fragments) {
      if (fragment.pulseMesh && fragment.pulseCount > 0) {
        const elapsed = now - fragment.pulseStartTime;
        const cycle = Math.floor(elapsed / (fragment.pulseDuration / fragment.pulseCount));
        const phase = (elapsed % (fragment.pulseDuration / fragment.pulseCount)) / (fragment.pulseDuration / fragment.pulseCount);

        if (cycle >= fragment.pulseCount) {
          fragment.pulseMesh.dispose();
          fragment.pulseMesh = null;
        } else {
          const pulsePhase = Math.sin(phase * Math.PI);
          fragment.pulseMesh.material.alpha = 0.5 * pulsePhase;
          fragment.pulseMesh.scaling = fragment.mesh.scaling.scale(1 + pulsePhase * 0.2);
        }
      }
    }
  }

  async useTool(toolType, intensity, fragmentIndex) {
    let affectedFragment = null;
    let damage = 0;

    if (fragmentIndex !== null && fragmentIndex >= 0 && fragmentIndex < this.fragments.length) {
      affectedFragment = this.fragments[fragmentIndex];
      damage = this.calculateToolDamage(toolType, intensity);

      if (affectedFragment.isDiscovered) {
        this.applyToolDamageVisual(affectedFragment, toolType, intensity);
      }
    }

    this.createToolParticles(toolType, intensity);

    return { affectedFragment, damage };
  }

  calculateToolDamage(toolType, intensity) {
    const rates = {
      air_chisel: 0.15,
      brush: 0.01,
      chemical: 0.03
    };
    return (rates[toolType] || 0.01) * intensity;
  }

  applyToolDamageVisual(fragment, toolType, intensity) {
    const damage = this.calculateToolDamage(toolType, intensity);
    fragment.data.erosion_level = Math.min(1, (fragment.data.erosion_level || 0) + damage);

    const mat = fragment.mesh.material;
    const erosion = fragment.data.erosion_level;

    mat.diffuseColor = new BABYLON.Color3(
      0.95 - erosion * 0.3,
      0.9 - erosion * 0.3,
      0.8 - erosion * 0.3
    );
    mat.specularPower = Math.max(1, 10 * (1 - erosion));

    this.createDamageParticles(fragment.mesh.position, toolType);
  }

  createToolParticles(toolType, intensity) {
    let color1, color2;

    switch (toolType) {
      case 'air_chisel':
        color1 = new BABYLON.Color4(0.6, 0.5, 0.4, 1);
        color2 = new BABYLON.Color4(0.4, 0.3, 0.2, 0.5);
        break;
      case 'brush':
        color1 = new BABYLON.Color4(0.8, 0.7, 0.6, 1);
        color2 = new BABYLON.Color4(0.6, 0.5, 0.4, 0.3);
        break;
      case 'chemical':
        color1 = new BABYLON.Color4(0.6, 0.8, 1, 1);
        color2 = new BABYLON.Color4(0.4, 0.6, 0.8, 0.5);
        break;
      default:
        color1 = new BABYLON.Color4(1, 1, 1, 1);
        color2 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.5);
    }

    const particleSystem = new BABYLON.ParticleSystem(
      `tool_${toolType}`,
      Math.floor(100 * intensity),
      this.scene
    );

    particleSystem.emitter = this.camera.position.add(
      this.camera.getForwardRay(3).direction
    );
    particleSystem.particleTexture = this.createParticleTexture();
    particleSystem.color1 = color1;
    particleSystem.color2 = color2;

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.6;
    particleSystem.emitRate = 50 * intensity;

    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
    particleSystem.direction2 = new BABYLON.Vector3(0.5, 2, 0.5);
    particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 1000);
    }, 200);
  }

  createDamageParticles(position, toolType) {
    const particleSystem = new BABYLON.ParticleSystem(
      `damage_${Date.now()}`,
      30,
      this.scene
    );

    particleSystem.emitter = position.clone();
    particleSystem.particleTexture = this.createParticleTexture();

    if (toolType === 'chemical') {
      particleSystem.color1 = new BABYLON.Color4(0.6, 0.8, 1, 1);
      particleSystem.color2 = new BABYLON.Color4(0.4, 0.6, 0.8, 0.3);
      particleSystem.emitRate = 40;
    } else {
      particleSystem.color1 = new BABYLON.Color4(0.9, 0.85, 0.75, 1);
      particleSystem.color2 = new BABYLON.Color4(0.7, 0.6, 0.45, 0.3);
      particleSystem.emitRate = 25;
    }

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.12;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.8;
    particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 1000);
    }, 400);
  }

  async playSnapAnimation(fragment1Index, fragment2Index) {
    if (fragment1Index < 0 || fragment2Index < 0) return;

    const f1 = this.fragments[fragment1Index];
    const f2 = this.fragments[fragment2Index];

    const startPos1 = f1.mesh.position.clone();
    const startPos2 = f2.mesh.position.clone();
    const midPoint = BABYLON.Vector3.Lerp(startPos1, startPos2, 0.5);

    const startTime = Date.now();
    const duration = 1500;

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        f1.mesh.position = BABYLON.Vector3.Lerp(startPos1, midPoint, eased * 0.5);
        f2.mesh.position = BABYLON.Vector3.Lerp(startPos2, midPoint, eased * 0.5);

        const mat1 = f1.mesh.material;
        const mat2 = f2.mesh.material;
        const glowIntensity = Math.sin(progress * Math.PI);
        mat1.emissiveColor = new BABYLON.Color3(0.3 * glowIntensity, 0.8 * glowIntensity, 1 * glowIntensity);
        mat2.emissiveColor = new BABYLON.Color3(0.3 * glowIntensity, 0.8 * glowIntensity, 1 * glowIntensity);

        if (progress >= 0.8 && progress < 0.85) {
          this.createSnapParticles(midPoint);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          mat1.emissiveColor = BABYLON.Color3.Black();
          mat2.emissiveColor = BABYLON.Color3.Black();

          const line = BABYLON.MeshBuilder.CreateLines(
            'connection',
            {
              points: [f1.mesh.position, f2.mesh.position],
              updatable: true
            },
            this.scene
          );
          const lineMat = new BABYLON.StandardMaterial('lineMat', this.scene);
          lineMat.emissiveColor = new BABYLON.Color3(0.3, 0.8, 1);
          line.material = lineMat;

          setTimeout(() => {
            line.dispose();
            resolve();
          }, 1500);
        }
      };
      animate();
    });
  }

  createSnapParticles(position) {
    const particleSystem = new BABYLON.ParticleSystem(
      'snap_particles',
      100,
      this.scene
    );

    particleSystem.emitter = position.clone();
    particleSystem.particleTexture = this.createParticleTexture();
    particleSystem.color1 = new BABYLON.Color4(0.3, 0.8, 1, 1);
    particleSystem.color2 = new BABYLON.Color4(0.1, 0.5, 0.8, 0.5);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.25;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1;
    particleSystem.emitRate = 200;

    particleSystem.direction1 = new BABYLON.Vector3(-2, 2, -2);
    particleSystem.direction2 = new BABYLON.Vector3(2, 4, 2);

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 1500);
    }, 200);
  }

  async playSlideRevealAnimation() {
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      if (layer.excavated < 1) continue;

      const originalX = layer.mesh.position.x;
      const startTime = Date.now();
      const duration = 1500;

      await new Promise((resolve) => {
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          layer.mesh.position.x = originalX + eased * 20;
          layer.mesh.material.alpha = 1 - eased;

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        animate();
      });
    }
  }

  createWalkAnimation() {
    const skeletonRoot = new BABYLON.TransformNode('skeleton_root', this.scene);
    const bones = [];

    const discoveredFragments = this.fragments.filter(f => f.isDiscovered);

    for (const fragment of discoveredFragments) {
      const boneNode = new BABYLON.TransformNode(`bone_${fragment.data.id}`, this.scene);
      fragment.mesh.setParent(boneNode);
      bones.push({
        node: boneNode,
        fragment: fragment,
        originalRotation: fragment.mesh.rotation.clone(),
        originalPosition: fragment.mesh.position.clone()
      });
    }

    let walkTime = 0;
    const walkSpeed = 0.002;

    const animateWalk = () => {
      walkTime += walkSpeed;

      for (let i = 0; i < bones.length; i++) {
        const bone = bones[i];
        const phase = walkTime + (i * Math.PI * 0.5);

        if (bone.fragment.data.bone_type === 'limb') {
          bone.node.rotation.x = Math.sin(phase) * 0.5;
        } else if (bone.fragment.data.bone_type === 'vertebra') {
          bone.node.rotation.z = Math.sin(phase) * 0.1;
        } else if (bone.fragment.data.bone_type === 'skull') {
          bone.node.rotation.x = Math.sin(walkTime * 2) * 0.05;
        }
      }

      skeletonRoot.position.z += 0.01;
      if (skeletonRoot.position.z > 10) {
        skeletonRoot.position.z = -5;
      }
    };

    this.animations.walk = this.scene.onBeforeRenderObservable.add(animateWalk);

    return {
      root: skeletonRoot,
      stop: () => {
        if (this.animations.walk) {
          this.scene.onBeforeRenderObservable.remove(this.animations.walk);
          this.animations.walk = null;
        }
        for (const bone of bones) {
          bone.node.dispose();
        }
      }
    };
  }

  handlePointerPick(pointerInfo) {
    const pickInfo = pointerInfo.pickInfo;
    if (!pickInfo.hit) {
      this.highlightFragment(-1);
      return;
    }

    const mesh = pickInfo.pickedMesh;

    for (let i = 0; i < this.fragments.length; i++) {
      if (this.fragments[i].mesh === mesh && this.fragments[i].isDiscovered) {
        this.highlightFragment(i);
        return;
      }
    }

    this.highlightFragment(-1);
  }

  clearLayers() {
    for (const layer of this.layers) {
      layer.mesh.dispose();
    }
    this.layers = [];
  }

  clearFragments() {
    for (const fragment of this.fragments) {
      if (fragment.highlightMesh) {
        fragment.highlightMesh.dispose();
      }
      if (fragment.pulseMesh) {
        fragment.pulseMesh.dispose();
      }
      fragment.mesh.dispose();
    }
    this.fragments = [];
    this.selectedFragment = null;
  }

  hexToColor3(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? new BABYLON.Color3(
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        )
      : new BABYLON.Color3(0.5, 0.5, 0.5);
  }

  dispose() {
    if (this.engine) {
      this.engine.dispose();
    }
  }
}

export default FossilSceneManager;
