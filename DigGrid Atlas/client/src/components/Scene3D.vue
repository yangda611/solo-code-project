<template>
  <div ref="containerRef" class="scene-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const props = defineProps({
  layers: {
    type: Array,
    default: () => []
  },
  artifacts: {
    type: Array,
    default: () => []
  },
  boundaries: {
    type: Array,
    default: () => []
  },
  toolMode: {
    type: String,
    default: 'select'
  },
  isStripping: {
    type: Boolean,
    default: false
  },
  currentLayerIndex: {
    type: Number,
    default: 0
  },
  measurementStart: {
    type: Object,
    default: null
  },
  measurementEnd: {
    type: Object,
    default: null
  },
  boundaryPoints: {
    type: Array,
    default: () => []
  },
  isDrawingBoundary: {
    type: Boolean,
    default: false
  },
  selectedArtifact: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'strip-layer',
  'mark-artifact',
  'select-artifact',
  'add-boundary-point',
  'measure-point'
])

const containerRef = ref(null)

let scene = null
let camera = null
let renderer = null
let controls = null
let raycaster = null
let mouse = null
let animationId = null

const layerMeshes = new Map()
const artifactMeshes = new Map()
const boundaryMeshes = new Map()
let groundPlane = null
let measurementLine = null
let measurementStartSphere = null
let measurementEndSphere = null
let boundaryPointsGroup = null
let boundaryLine = null
let brushParticles = null
let highlightMesh = null

const SQUARE_SIZE = 6
const LAYER_HEIGHT = 0.5

onMounted(() => {
  initScene()
  animate()
  nextTick(() => {
    onResize()
  })
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  disposeScene()
})

function initScene() {
  const container = containerRef.value
  if (!container) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  scene.fog = new THREE.Fog(0x1a1a2e, 10, 50)

  const aspect = container.clientWidth / container.clientHeight
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(8, 6, 8)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 3
  controls.maxDistance = 30
  controls.maxPolarAngle = Math.PI / 2.1
  controls.target.set(0, -1, 0)

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 15, 10)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 50
  directionalLight.shadow.camera.left = -15
  directionalLight.shadow.camera.right = 15
  directionalLight.shadow.camera.top = 15
  directionalLight.shadow.camera.bottom = -15
  scene.add(directionalLight)

  const fillLight = new THREE.DirectionalLight(0x4a90d9, 0.3)
  fillLight.position.set(-10, 5, -10)
  scene.add(fillLight)

  createGroundPlane()
  createGridHelper()
  createMeasurementLine()
  createBoundaryDrawing()
  createHighlightMesh()
  createBrushParticles()

  renderer.domElement.addEventListener('click', onMouseClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onResize)
}

function createGroundPlane() {
  const geometry = new THREE.PlaneGeometry(SQUARE_SIZE, SQUARE_SIZE)
  const material = new THREE.MeshStandardMaterial({
    color: 0x2d2d3a,
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9
  })
  groundPlane = new THREE.Mesh(geometry, material)
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = -3
  groundPlane.receiveShadow = true
  scene.add(groundPlane)

  const borderGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE))
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4a90d9, linewidth: 2 })
  const border = new THREE.LineSegments(borderGeometry, borderMaterial)
  border.position.y = -3.05
  scene.add(border)
}

function createGridHelper() {
  const gridHelper = new THREE.GridHelper(SQUARE_SIZE, 12, 0x4a90d9, 0x3a3a4a)
  gridHelper.position.y = -2.99
  scene.add(gridHelper)
}

function createMeasurementLine() {
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.LineDashedMaterial({
    color: 0x00ff88,
    dashSize: 0.1,
    gapSize: 0.05,
    linewidth: 2
  })
  measurementLine = new THREE.Line(geometry, material)
  measurementLine.computeLineDistances()
  scene.add(measurementLine)

  const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16)
  const startMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 })
  const endMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 })
  measurementStartSphere = new THREE.Mesh(sphereGeometry, startMaterial)
  measurementEndSphere = new THREE.Mesh(sphereGeometry, endMaterial)
  measurementStartSphere.visible = false
  measurementEndSphere.visible = false
  scene.add(measurementStartSphere)
  scene.add(measurementEndSphere)
}

function createBoundaryDrawing() {
  boundaryPointsGroup = new THREE.Group()
  scene.add(boundaryPointsGroup)

  const geometry = new THREE.BufferGeometry()
  const material = new THREE.LineBasicMaterial({
    color: 0xff4444,
    linewidth: 2
  })
  boundaryLine = new THREE.Line(geometry, material)
  scene.add(boundaryLine)
}

function createHighlightMesh() {
  const geometry = new THREE.RingGeometry(0.15, 0.2, 32)
  const material = new THREE.MeshBasicMaterial({
    color: 0x4a90d9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  })
  highlightMesh = new THREE.Mesh(geometry, material)
  highlightMesh.rotation.x = -Math.PI / 2
  highlightMesh.visible = false
  scene.add(highlightMesh)
}

function createBrushParticles() {
  const particleCount = 200
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = -10
    positions[i * 3 + 2] = 0
    
    colors[i * 3] = 0.6 + Math.random() * 0.2
    colors[i * 3 + 1] = 0.4 + Math.random() * 0.1
    colors[i * 3 + 2] = 0.2 + Math.random() * 0.1
    
    sizes[i] = 0.02 + Math.random() * 0.03
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })

  brushParticles = new THREE.Points(geometry, material)
  brushParticles.visible = false
  scene.add(brushParticles)
}

function disposeScene() {
  renderer.domElement.removeEventListener('click', onMouseClick)
  renderer.domElement.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)

  layerMeshes.forEach(mesh => {
    mesh.geometry.dispose()
    mesh.material.dispose()
  })
  layerMeshes.clear()

  artifactMeshes.forEach(mesh => {
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
    }
  })
  artifactMeshes.clear()

  if (groundPlane) {
    groundPlane.geometry.dispose()
    groundPlane.material.dispose()
  }

  renderer.dispose()
  controls.dispose()
}

function onResize() {
  const container = containerRef.value
  if (!container || !camera || !renderer) return

  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
}

function onMouseMove(event) {
  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  updateHighlight()
}

function updateHighlight() {
  if (!raycaster || !scene) return

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects([...layerMeshes.values(), ...artifactMeshes.values()], true)

  if (intersects.length > 0) {
    const point = intersects[0].point
    highlightMesh.position.set(point.x, point.y + 0.01, point.z)
    highlightMesh.visible = true
  } else {
    highlightMesh.visible = false
  }
}

function onMouseClick(event) {
  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  handleClick()
}

function handleClick() {
  if (!raycaster || !scene) return

  raycaster.setFromCamera(mouse, camera)

  const allMeshes = [...artifactMeshes.values(), ...layerMeshes.values()]
  const intersects = raycaster.intersectObjects(allMeshes, true)

  if (intersects.length === 0) return

  const hit = intersects[0]
  const point = hit.point

  switch (props.toolMode) {
    case 'select':
      handleSelectClick(hit)
      break
    case 'strip':
      handleStripClick(hit)
      break
    case 'mark':
      handleMarkClick(point)
      break
    case 'boundary':
      handleBoundaryClick(point)
      break
    case 'measure':
      handleMeasureClick(point)
      break
  }
}

function handleSelectClick(hit) {
  let targetMesh = hit.object
  while (targetMesh.parent && !artifactMeshes.has(targetMesh.userData?.artifactId)) {
    targetMesh = targetMesh.parent
  }

  const artifactId = targetMesh.userData?.artifactId
  if (artifactId && props.artifacts) {
    const artifact = props.artifacts.find(a => a.id === artifactId)
    if (artifact) {
      emit('select-artifact', artifact)
      playArtifactSelectAnimation(artifactMeshes.get(artifactId))
    }
  }
}

function handleStripClick(hit) {
  let targetMesh = hit.object
  while (targetMesh.parent && !layerMeshes.has(targetMesh.userData?.layerId)) {
    targetMesh = targetMesh.parent
  }

  const layerId = targetMesh.userData?.layerId
  if (layerId) {
    const layer = props.layers.find(l => l.id === layerId)
    if (layer && !layer.is_stripped) {
      playStripAnimation(layerId, () => {
        emit('strip-layer')
      })
    }
  }
}

function handleMarkClick(point) {
  emit('mark-artifact', {
    x: parseFloat(point.x.toFixed(3)),
    y: parseFloat(point.y.toFixed(3)),
    z: parseFloat(point.z.toFixed(3))
  })
  playMarkAnimation(point)
}

function handleBoundaryClick(point) {
  if (props.isDrawingBoundary) {
    emit('add-boundary-point', {
      x: parseFloat(point.x.toFixed(3)),
      y: parseFloat(point.y.toFixed(3)),
      z: parseFloat(point.z.toFixed(3))
    })
  }
}

function handleMeasureClick(point) {
  emit('measure-point', {
    x: parseFloat(point.x.toFixed(3)),
    y: parseFloat(point.y.toFixed(3)),
    z: parseFloat(point.z.toFixed(3))
  })
}

function updateLayers() {
  if (!scene) return

  layerMeshes.forEach((mesh, id) => {
    scene.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.dispose()
  })
  layerMeshes.clear()

  props.layers.forEach((layer, index) => {
    createLayerMesh(layer, index)
  })
}

function createLayerMesh(layer, index) {
  const thickness = layer.depth_end - layer.depth_start || LAYER_HEIGHT
  const yOffset = -layer.depth_start - thickness / 2

  const geometry = new THREE.BoxGeometry(SQUARE_SIZE - 0.02, thickness, SQUARE_SIZE - 0.02)
  
  const color = new THREE.Color(layer.color || 0x8B4513)
  
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: layer.is_stripped ? 0 : 1
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = yOffset
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.layerId = layer.id

  const edgeGeometry = new THREE.EdgesGeometry(geometry)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: color.clone().multiplyScalar(0.6),
    transparent: true,
    opacity: layer.is_stripped ? 0 : 0.5
  })
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
  mesh.add(edges)

  const sideGeometry = new THREE.PlaneGeometry(SQUARE_SIZE - 0.02, thickness)
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: color.clone().multiplyScalar(0.8),
    roughness: 0.95
  })

  const sides = [
    { pos: [0, 0, (SQUARE_SIZE - 0.02) / 2], rot: [0, 0, 0] },
    { pos: [0, 0, -(SQUARE_SIZE - 0.02) / 2], rot: [0, Math.PI, 0] },
    { pos: [(SQUARE_SIZE - 0.02) / 2, 0, 0], rot: [0, Math.PI / 2, 0] },
    { pos: [-(SQUARE_SIZE - 0.02) / 2, 0, 0], rot: [0, -Math.PI / 2, 0] }
  ]

  sides.forEach(side => {
    const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial)
    sideMesh.position.set(...side.pos)
    sideMesh.rotation.set(...side.rot)
    mesh.add(sideMesh)
  })

  scene.add(mesh)
  layerMeshes.set(layer.id, mesh)
}

function updateArtifacts() {
  if (!scene) return

  artifactMeshes.forEach((mesh, id) => {
    scene.remove(mesh)
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
    }
  })
  artifactMeshes.clear()

  props.artifacts.forEach(artifact => {
    createArtifactMesh(artifact)
  })
}

function createArtifactMesh(artifact) {
  let geometry
  let material

  const size = 0.15 + Math.random() * 0.1

  switch (artifact.type) {
    case 'pottery':
      geometry = new THREE.CylinderGeometry(size * 0.4, size * 0.6, size * 1.2, 16)
      material = new THREE.MeshStandardMaterial({
        color: 0xE6A23C,
        roughness: 0.7,
        metalness: 0.1
      })
      break
    case 'bone':
      geometry = new THREE.CapsuleGeometry(size * 0.3, size, 8, 16)
      material = new THREE.MeshStandardMaterial({
        color: 0xF5DEB3,
        roughness: 0.6,
        metalness: 0.05
      })
      break
    case 'copper':
      geometry = new THREE.CylinderGeometry(size * 0.5, size * 0.5, size * 0.2, 16)
      material = new THREE.MeshStandardMaterial({
        color: 0xB87333,
        roughness: 0.4,
        metalness: 0.8
      })
      break
    case 'stone':
      geometry = new THREE.DodecahedronGeometry(size * 0.6, 0)
      material = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.95,
        metalness: 0.05
      })
      break
    default:
      geometry = new THREE.BoxGeometry(size, size, size)
      material = new THREE.MeshStandardMaterial({
        color: 0x409EFF,
        roughness: 0.5,
        metalness: 0.3
      })
  }

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(artifact.position_x, artifact.position_y, artifact.position_z)
  mesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.artifactId = artifact.id

  const ringGeometry = new THREE.RingGeometry(size * 0.8, size, 32)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: getArtifactColor(artifact.type),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.01
  mesh.add(ring)

  scene.add(mesh)
  artifactMeshes.set(artifact.id, mesh)

  playArtifactAppearAnimation(mesh)
}

function getArtifactColor(type) {
  const colors = {
    pottery: 0xE6A23C,
    bone: 0xF5DEB3,
    copper: 0xB87333,
    stone: 0x808080,
    other: 0x409EFF
  }
  return colors[type] || 0x409EFF
}

function updateBoundaries() {
  if (!scene) return

  boundaryMeshes.forEach((mesh, id) => {
    scene.remove(mesh)
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) mesh.material.dispose()
  })
  boundaryMeshes.clear()

  props.boundaries.forEach(boundary => {
    createBoundaryMesh(boundary)
  })
}

function createBoundaryMesh(boundary) {
  if (!boundary.points || boundary.points.length < 3) return

  const points = boundary.points.map(p => new THREE.Vector3(p.x, p.y, p.z))
  points.push(points[0])

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const color = new THREE.Color(boundary.color || 0xFF0000)
  
  const lineMaterial = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 3
  })
  const line = new THREE.Line(geometry, lineMaterial)

  const shape = new THREE.Shape()
  shape.moveTo(points[0].x, points[0].z)
  for (let i = 1; i < points.length - 1; i++) {
    shape.lineTo(points[i].x, points[i].z)
  }

  const fillGeometry = new THREE.ShapeGeometry(shape)
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  })
  const fill = new THREE.Mesh(fillGeometry, fillMaterial)
  fill.rotation.x = -Math.PI / 2
  fill.position.y = points[0].y + 0.01

  const group = new THREE.Group()
  group.add(line)
  group.add(fill)

  points.slice(0, -1).forEach((point, index) => {
    const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: color })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.copy(point)
    group.add(sphere)
  })

  scene.add(group)
  boundaryMeshes.set(boundary.id, group)
}

function updateMeasurementLine() {
  if (!measurementLine) return

  if (props.measurementStart && props.measurementEnd) {
    const start = new THREE.Vector3(
      props.measurementStart.x,
      props.measurementStart.y,
      props.measurementStart.z
    )
    const end = new THREE.Vector3(
      props.measurementEnd.x,
      props.measurementEnd.y,
      props.measurementEnd.z
    )

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    measurementLine.geometry.dispose()
    measurementLine.geometry = geometry
    measurementLine.computeLineDistances()
    measurementLine.visible = true

    measurementStartSphere.position.copy(start)
    measurementStartSphere.visible = true
    measurementEndSphere.position.copy(end)
    measurementEndSphere.visible = true
  } else if (props.measurementStart) {
    measurementStartSphere.position.set(
      props.measurementStart.x,
      props.measurementStart.y,
      props.measurementStart.z
    )
    measurementStartSphere.visible = true
    measurementEndSphere.visible = false
    measurementLine.visible = false
  } else {
    measurementLine.visible = false
    measurementStartSphere.visible = false
    measurementEndSphere.visible = false
  }
}

function updateBoundaryDrawing() {
  if (!boundaryLine || !boundaryPointsGroup) return

  if (props.boundaryPoints && props.boundaryPoints.length > 0) {
    const points = props.boundaryPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))
    
    if (points.length > 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      boundaryLine.geometry.dispose()
      boundaryLine.geometry = geometry
      boundaryLine.visible = true
    } else {
      boundaryLine.visible = false
    }

    while (boundaryPointsGroup.children.length > 0) {
      const child = boundaryPointsGroup.children[0]
      child.geometry.dispose()
      child.material.dispose()
      boundaryPointsGroup.remove(child)
    }

    points.forEach(point => {
      const sphereGeometry = new THREE.SphereGeometry(0.06, 12, 12)
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.copy(point)
      boundaryPointsGroup.add(sphere)
    })

    boundaryPointsGroup.visible = true
  } else {
    boundaryLine.visible = false
    boundaryPointsGroup.visible = false
  }
}

function updateSelectedArtifact() {
  if (!props.selectedArtifact) return

  const mesh = artifactMeshes.get(props.selectedArtifact.id)
  if (mesh) {
    playArtifactSelectAnimation(mesh)
  }
}

function playStripAnimation(layerId, callback) {
  const mesh = layerMeshes.get(layerId)
  if (!mesh) {
    callback()
    return
  }

  playBrushAnimation(mesh.position)

  const originalY = mesh.position.y
  const targetY = originalY - 3

  new TWEEN.Tween({ y: originalY, opacity: 1 })
    .to({ y: targetY, opacity: 0 }, 1500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate((obj) => {
      mesh.position.y = obj.y
      mesh.material.opacity = obj.opacity
      mesh.children.forEach(child => {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.opacity = obj.opacity)
          } else {
            child.material.opacity = obj.opacity
          }
        }
      })
    })
    .onComplete(() => {
      mesh.visible = false
      callback()
    })
    .start()
}

function playBrushAnimation(position) {
  if (!brushParticles) return

  brushParticles.visible = true
  const positions = brushParticles.geometry.attributes.position.array
  const particleCount = positions.length / 3

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = position.x + (Math.random() - 0.5) * 2
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2
  }
  brushParticles.geometry.attributes.position.needsUpdate = true

  const startPositions = [...positions]
  
  new TWEEN.Tween({ progress: 0 })
    .to({ progress: 1 }, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate((obj) => {
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = startPositions[i * 3] + (Math.random() - 0.5) * 2 * obj.progress
        positions[i * 3 + 1] = startPositions[i * 3 + 1] + 2 * obj.progress
        positions[i * 3 + 2] = startPositions[i * 3 + 2] + (Math.random() - 0.5) * 2 * obj.progress
      }
      brushParticles.geometry.attributes.position.needsUpdate = true
      brushParticles.material.opacity = 1 - obj.progress
    })
    .onComplete(() => {
      brushParticles.visible = false
      brushParticles.material.opacity = 0.8
    })
    .start()
}

function playArtifactAppearAnimation(mesh) {
  if (!mesh) return

  const originalScale = mesh.scale.clone()
  mesh.scale.set(0.01, 0.01, 0.01)

  new TWEEN.Tween({ scale: 0.01 })
    .to({ scale: 1 }, 800)
    .easing(TWEEN.Easing.Elastic.Out)
    .onUpdate((obj) => {
      mesh.scale.set(
        originalScale.x * obj.scale,
        originalScale.y * obj.scale,
        originalScale.z * obj.scale
      )
    })
    .start()
}

function playArtifactSelectAnimation(mesh) {
  if (!mesh) return

  const originalY = mesh.position.y
  
  new TWEEN.Tween({ y: originalY, scale: 1 })
    .to({ y: originalY + 0.3, scale: 1.2 }, 300)
    .easing(TWEEN.Easing.Quadratic.Out)
    .yoyo(true)
    .repeat(1)
    .onUpdate((obj) => {
      mesh.position.y = obj.y
      mesh.scale.set(obj.scale, obj.scale, obj.scale)
    })
    .start()
}

function playMarkAnimation(point) {
  const geometry = new THREE.RingGeometry(0.1, 0.15, 32)
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = -Math.PI / 2
  ring.position.set(point.x, point.y + 0.02, point.z)
  scene.add(ring)

  new TWEEN.Tween({ scale: 0.5, opacity: 1 })
    .to({ scale: 2, opacity: 0 }, 1000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate((obj) => {
      ring.scale.set(obj.scale, obj.scale, 1)
      ring.material.opacity = obj.opacity
    })
    .onComplete(() => {
      ring.geometry.dispose()
      ring.material.dispose()
      scene.remove(ring)
    })
    .start()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  TWEEN.update()
  
  if (controls) {
    controls.update()
  }

  artifactMeshes.forEach(mesh => {
    mesh.rotation.y += 0.005
  })

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

watch(() => props.layers, updateLayers, { deep: true })
watch(() => props.artifacts, updateArtifacts, { deep: true })
watch(() => props.boundaries, updateBoundaries, { deep: true })
watch(() => props.measurementStart, updateMeasurementLine, { deep: true })
watch(() => props.measurementEnd, updateMeasurementLine, { deep: true })
watch(() => props.boundaryPoints, updateBoundaryDrawing, { deep: true })
watch(() => props.isDrawingBoundary, updateBoundaryDrawing)
watch(() => props.selectedArtifact, updateSelectedArtifact)
</script>

<style scoped>
.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.scene-container :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>