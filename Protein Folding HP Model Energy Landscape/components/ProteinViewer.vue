<template>
  <div ref="containerRef" class="w-full h-full bg-space-dark relative overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
    <div class="absolute top-4 left-4 glass-panel p-3 text-sm text-white">
      <div class="font-orbitron text-bio-blue mb-2">3D 视图控制</div>
      <div class="space-y-1 text-xs opacity-80">
        <p>🖱️ 左键拖拽: 旋转</p>
        <p>🖱️ 右键拖拽: 平移</p>
        <p>🖱️ 滚轮: 缩放</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { useSimulationStore } from '~/composables/useSimulationStore';
import gsap from 'gsap';

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let composer: EffectComposer;
let animationId: number;
let residueMeshes: THREE.Mesh[] = [];
let bondLines: THREE.Line[] = [];
let contactLines: THREE.Line[] = [];
let gridHelper: THREE.GridHelper;

const store = useSimulationStore();

const COLORS = {
  hydrophobic: new THREE.Color(0xe53935),
  polar: new THREE.Color(0x29b6f6),
  contact: new THREE.Color(0x76ff03),
  bond: new THREE.Color(0x444466),
  grid: new THREE.Color(0x1a1a2e)
};

const initScene = () => {
  if (!canvasRef.value || !containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1628);
  scene.fog = new THREE.Fog(0x0a1628, 20, 60);

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(15, 12, 15);

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 50;

  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(10, 20, 10);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0x4488ff, 0.5);
  directionalLight2.position.set(-10, -5, -10);
  scene.add(directionalLight2);

  const pointLight = new THREE.PointLight(0x76ff03, 0.5, 30);
  pointLight.position.set(0, 5, 0);
  scene.add(pointLight);

  const gridSize = 40;
  gridHelper = new THREE.GridHelper(gridSize, gridSize, COLORS.grid, COLORS.grid);
  gridHelper.position.y = -0.5;
  scene.add(gridHelper);

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.4,
    0.5,
    0.85
  );

  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  animate();
  window.addEventListener('resize', handleResize);
};

const handleResize = () => {
  if (!containerRef.value) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
};

const createResidue = (type: 'H' | 'P'): THREE.Mesh => {
  const geometry = new THREE.IcosahedronGeometry(0.45, 1);
  const material = new THREE.MeshStandardMaterial({
    color: type === 'H' ? COLORS.hydrophobic : COLORS.polar,
    metalness: 0.3,
    roughness: 0.4,
    emissive: type === 'H' ? COLORS.hydrophobic : COLORS.polar,
    emissiveIntensity: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const createBond = (from: THREE.Vector3, to: THREE.Vector3): THREE.Line => {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({
    color: COLORS.bond,
    linewidth: 2,
    transparent: true,
    opacity: 0.6
  });
  return new THREE.Line(geometry, material);
};

const createContactLine = (from: THREE.Vector3, to: THREE.Vector3): THREE.Line => {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({
    color: COLORS.contact,
    linewidth: 3,
    transparent: true,
    opacity: 0.9
  });
  const line = new THREE.Line(geometry, material);
  return line;
};

const updateVisualization = () => {
  residueMeshes.forEach(m => scene.remove(m));
  bondLines.forEach(l => scene.remove(l));
  contactLines.forEach(l => scene.remove(l));
  residueMeshes = [];
  bondLines = [];
  contactLines = [];

  const { positions, sequence, contactPairs } = store.state;

  positions.forEach((pos, i) => {
    const mesh = createResidue(sequence[i]);
    mesh.position.set(pos.x, pos.y, pos.z);
    scene.add(mesh);
    residueMeshes.push(mesh);
  });

  for (let i = 0; i < positions.length - 1; i++) {
    const from = new THREE.Vector3(positions[i].x, positions[i].y, positions[i].z);
    const to = new THREE.Vector3(positions[i + 1].x, positions[i + 1].y, positions[i + 1].z);
    const line = createBond(from, to);
    scene.add(line);
    bondLines.push(line);
  }

  contactPairs.forEach(pair => {
    const from = new THREE.Vector3(
      positions[pair.i].x,
      positions[pair.i].y,
      positions[pair.i].z
    );
    const to = new THREE.Vector3(
      positions[pair.j].x,
      positions[pair.j].y,
      positions[pair.j].z
    );
    const line = createContactLine(from, to);
    scene.add(line);
    contactLines.push(line);

    gsap.to([residueMeshes[pair.i].material, residueMeshes[pair.j].material], {
      emissiveIntensity: 0.5,
      duration: 0.3,
      yoyo: true,
      repeat: 1
    });
  });
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls.update();
  composer.render();
};

watch(
  () => [store.state.positions, store.state.contactPairs],
  () => {
    updateVisualization();
  },
  { deep: true }
);

onMounted(() => {
  initScene();
  updateVisualization();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', handleResize);
  renderer.dispose();
  controls.dispose();
});
</script>
