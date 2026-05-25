<template>
  <div class="editor-container">
    <div class="canvas-wrapper">
      <canvas ref="canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp"></canvas>
      <div class="trajectory-indicator">末端轨迹</div>
    </div>
    
    <div class="sidebar">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="预设" name="presets">
          <div class="preset-buttons">
            <el-button type="primary" size="small" @click="loadPreset('leg')">预设一: 腿部</el-button>
            <el-button type="success" size="small" @click="loadPreset('arm')">预设二: 机械臂</el-button>
            <el-button type="warning" size="small" @click="loadPreset('tentacle')">预设三: 触手</el-button>
            <el-button type="danger" size="small" @click="loadPreset('skin_weights')">预设四: 蒙皮</el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="求解器" name="solver">
          <el-form label-width="100px" size="small">
            <el-form-item label="求解器">
              <el-select v-model="solverType" @change="onSolverChange">
                <el-option label="CCD" value="ccd"></el-option>
                <el-option label="FABRIK" value="fabrik"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="最大迭代">
              <el-slider v-model="maxIterations" :min="1" :max="200" show-input></el-slider>
            </el-form-item>
            <el-form-item label="误差阈值">
              <el-slider v-model="threshold" :min="0.01" :max="5" :step="0.01" show-input></el-slider>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="solve">求解</el-button>
              <el-switch v-model="autoSolve" active-text="自动求解"></el-switch>
            </el-form-item>
          </el-form>
          
          <div v-if="solveResult" class="result-panel">
            <div class="result-item">
              <span class="label">成功:</span>
              <span :class="['value', solveResult.success ? 'success' : 'fail']">{{ solveResult.success ? '是' : '否' }}</span>
            </div>
            <div class="result-item">
              <span class="label">迭代次数:</span>
              <span class="value">{{ solveResult.iterations }}</span>
            </div>
            <div class="result-item">
              <span class="label">最终误差:</span>
              <span class="value">{{ solveResult.error.toFixed(4) }}</span>
            </div>
            <div class="result-item" v-if="constraintViolations.length">
              <span class="label">约束违反:</span>
              <span class="value violation">{{ constraintViolations.length }}次</span>
            </div>
          </div>
          
          <div class="error-chart">
            <div class="chart-title">误差下降曲线</div>
            <div class="bars-container">
              <div 
                v-for="(error, i) in displayErrors" 
                :key="i" 
                class="error-bar"
                :style="{ height: (error / maxError * 100) + '%' }"
              ></div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="骨骼" name="bones">
          <div class="bone-list">
            <div 
              v-for="bone in bones" 
              :key="bone.id"
              class="bone-item"
              :class="{ selected: selectedBone === bone.id, violating: isViolating(bone.id) }"
              @click="selectBone(bone.id)"
            >
              <span class="bone-name">{{ bone.id }}</span>
              <span class="bone-length">L: {{ bone.length }}</span>
            </div>
          </div>
          
          <div v-if="selectedBone" class="bone-editor">
            <el-form label-width="100px" size="small">
              <el-form-item label="角度">
                <el-slider v-model="selectedBoneData.angle" :min="-3.14" :max="3.14" :step="0.01" show-input></el-slider>
              </el-form-item>
              <el-form-item label="约束最小">
                <el-slider v-model="selectedBoneData.constraint.min" :min="-3.14" :max="3.14" :step="0.01" show-input></el-slider>
              </el-form-item>
              <el-form-item label="约束最大">
                <el-slider v-model="selectedBoneData.constraint.max" :min="-3.14" :max="3.14" :step="0.01" show-input></el-slider>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="动画" name="animation">
          <el-form label-width="100px" size="small">
            <el-form-item label="弹簧阻尼">
              <el-slider v-model="springDamping" :min="0" :max="1" :step="0.01"></el-slider>
            </el-form-item>
            <el-form-item label="弹簧刚度">
              <el-slider v-model="springStiffness" :min="0.01" :max="1" :step="0.01"></el-slider>
            </el-form-item>
            <el-form-item label="播放速度">
              <el-slider v-model="animationSpeed" :min="0.1" :max="3" :step="0.1"></el-slider>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="togglePlay">{{ isPlaying ? '暂停' : '播放' }}</el-button>
              <el-button @click="addKeyframe">添加关键帧</el-button>
            </el-form-item>
          </el-form>
          
          <div class="timeline">
            <div class="timeline-track">
              <div 
                v-for="kf in keyframes" 
                :key="kf.id" 
                class="keyframe-marker"
                :style="{ left: (kf.frame_number / 100 * 100) + '%' }"
              ></div>
            </div>
            <el-slider v-model="currentFrame" :min="0" :max="100" show-input class="frame-slider"></el-slider>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="蒙皮" name="skin">
          <div class="skin-controls">
            <el-button @click="toggleMesh">{{ showMesh ? '隐藏网格' : '显示网格' }}</el-button>
            <el-button @click="generateExtremeWeights">生成极值权重</el-button>
          </div>
          <div class="weight-info" v-if="meshVertices.length">
            顶点数: {{ meshVertices.length }} | 权重数: {{ skinWeights.length }}
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { Skeleton, CCDSolver, FABRIKSolver } from '../utils/ik-solver'

export default {
  name: 'EditorView',
  setup() {
    const store = useStore()
    const canvas = ref(null)
    const ctx = ref(null)
    const activeTab = ref('solver')
    const autoSolve = ref(true)
    const dragging = ref(null)
    const showMesh = ref(true)
    const animationFrame = ref(null)
    const lastAngles = ref({})
    
    const bones = computed(() => store.state.bones)
    const selectedBone = computed(() => store.state.selectedBone)
    const targetPosition = computed(() => store.state.targetPosition)
    const solverType = computed(() => store.state.solverType)
    const maxIterations = computed(() => store.state.maxIterations)
    const threshold = computed(() => store.state.threshold)
    const solveResult = computed(() => store.state.solveResult)
    const errorHistory = computed(() => store.state.errorHistory)
    const constraintViolations = computed(() => store.state.constraintViolations)
    const keyframes = computed(() => store.state.keyframes)
    const currentFrame = computed(() => store.state.currentFrame)
    const isPlaying = computed(() => store.state.isPlaying)
    const animationSpeed = computed(() => store.state.animationSpeed)
    const springDamping = computed(() => store.state.springDamping)
    const springStiffness = computed(() => store.state.springStiffness)
    const trailPath = computed(() => store.state.trailPath)
    const meshVertices = computed(() => store.state.meshVertices)
    const skinWeights = computed(() => store.state.skinWeights)
    
    const selectedBoneData = computed({
      get: () => store.getters.getBoneById(selectedBone.value),
      set: (val) => store.commit('UPDATE_BONE', { id: val.id, data: val })
    })
    
    const displayErrors = computed(() => {
      const maxBars = 50
      const errors = errorHistory.value
      if (errors.length <= maxBars) return errors
      const step = Math.floor(errors.length / maxBars)
      return errors.filter((_, i) => i % step === 0)
    })
    
    const maxError = computed(() => Math.max(...displayErrors.value, 0.1))
    
    function initCanvas() {
      const c = canvas.value
      c.width = c.offsetWidth
      c.height = c.offsetHeight
      ctx.value = c.getContext('2d')
    }
    
    function getBoneWorldPosition(bone, allBones) {
      if (!bone || !allBones || allBones.length === 0) {
        return { x: bone?.x || 0, y: bone?.y || 0, angle: bone?.angle || 0 }
      }
      
      const chain = [bone]
      let parent = allBones.find(b => b.id === bone.parentId)
      
      while (parent) {
        chain.unshift(parent)
        const nextParent = allBones.find(b => b.id === parent.parentId)
        if (nextParent === parent) break
        parent = nextParent
      }
      
      let worldX = chain[0].x
      let worldY = chain[0].y
      let worldAngle = 0
      
      for (let i = 0; i < chain.length; i++) {
        const b = chain[i]
        if (b && typeof b.angle === 'number') {
          worldAngle += b.angle
        }
        if (i < chain.length - 1 && b && typeof b.length === 'number') {
          worldX += Math.cos(worldAngle) * b.length
          worldY += Math.sin(worldAngle) * b.length
        }
      }
      
      return { x: worldX, y: worldY, angle: worldAngle }
    }
    
    function getEndEffector() {
      if (!bones.value || !bones.value.length) return { x: 0, y: 0 }
      
      let leaf = null
      for (const bone of bones.value) {
        if (!bone) continue
        const hasChild = bones.value.some(b => b && b.parentId === bone.id)
        if (!hasChild) {
          leaf = bone
          break
        }
      }
      
      if (!leaf) {
        const validBones = bones.value.filter(b => b)
        if (validBones.length === 0) return { x: 0, y: 0 }
        leaf = validBones[validBones.length - 1]
      }
      
      const world = getBoneWorldPosition(leaf, bones.value)
      const endX = world.x + Math.cos(world.angle) * (leaf.length || 0)
      const endY = world.y + Math.sin(world.angle) * (leaf.length || 0)
      
      return { x: endX, y: endY }
    }
    
    function render() {
      const c = ctx.value
      const width = canvas.value.width
      const height = canvas.value.height
      
      c.clearRect(0, 0, width, height)
      
      c.strokeStyle = '#e0e0e0'
      c.lineWidth = 1
      for (let x = 0; x < width; x += 50) {
        c.beginPath()
        c.moveTo(x, 0)
        c.lineTo(x, height)
        c.stroke()
      }
      for (let y = 0; y < height; y += 50) {
        c.beginPath()
        c.moveTo(0, y)
        c.lineTo(width, y)
        c.stroke()
      }
      
      if (trailPath.value.length > 1) {
        c.beginPath()
        c.strokeStyle = 'rgba(100, 150, 255, 0.5)'
        c.lineWidth = 2
        c.moveTo(trailPath.value[0].x, trailPath.value[0].y)
        for (let i = 1; i < trailPath.value.length; i++) {
          c.lineTo(trailPath.value[i].x, trailPath.value[i].y)
        }
        c.stroke()
      }
      
      if (showMesh.value && meshVertices.value.length) {
        renderMesh(c)
      }
      
      const violatingBones = new Set(
        constraintViolations.value
          .filter(v => v && v.boneId)
          .map(v => v.boneId)
      )
      
      bones.value.forEach(bone => {
        if (!bone) return
        
        const world = getBoneWorldPosition(bone, bones.value)
        const endX = world.x + Math.cos(world.angle) * (bone.length || 0)
        const endY = world.y + Math.sin(world.angle) * (bone.length || 0)
        
        const isSelected = bone.id === selectedBone.value
        const isViolating = violatingBones.has(bone.id)
        
        if (isViolating) {
          const flash = Math.sin(Date.now() / 100) * 0.5 + 0.5
          c.shadowColor = `rgba(255, 0, 0, ${flash})`
          c.shadowBlur = 20
        }
        
        c.beginPath()
        c.moveTo(world.x, world.y)
        c.lineTo(endX, endY)
        c.strokeStyle = isSelected ? '#ff6b6b' : (isViolating ? '#ff0000' : '#4a90d9')
        c.lineWidth = isSelected ? 6 : 4
        c.lineCap = 'round'
        c.stroke()
        c.shadowBlur = 0
        
        c.beginPath()
        c.arc(world.x, world.y, 8, 0, Math.PI * 2)
        c.fillStyle = '#333'
        c.fill()
        
        if (bone.constraint && bone.constraint.min !== undefined && bone.constraint.max !== undefined) {
          let parentWorldAngle = 0
          if (bone.parentId) {
            const parentBone = bones.value.find(b => b.id === bone.parentId)
            if (parentBone) {
              const parentWorld = getBoneWorldPosition(parentBone, bones.value)
              parentWorldAngle = parentWorld.angle
            }
          }
          
          const minAngle = bone.constraint.min + parentWorldAngle
          const maxAngle = bone.constraint.max + parentWorldAngle
          
          c.beginPath()
          c.arc(world.x, world.y, 20, minAngle, maxAngle)
          c.strokeStyle = 'rgba(100, 200, 100, 0.5)'
          c.lineWidth = 2
          c.stroke()
        }
      })
      
      const target = targetPosition.value
      c.beginPath()
      c.arc(target.x, target.y, 12, 0, Math.PI * 2)
      c.fillStyle = 'rgba(255, 100, 100, 0.3)'
      c.fill()
      c.strokeStyle = '#ff4444'
      c.lineWidth = 3
      c.stroke()
      
      c.beginPath()
      c.moveTo(target.x - 8, target.y)
      c.lineTo(target.x + 8, target.y)
      c.moveTo(target.x, target.y - 8)
      c.lineTo(target.x, target.y + 8)
      c.stroke()
      
      const endEffector = getEndEffector()
      c.beginPath()
      c.arc(endEffector.x, endEffector.y, 6, 0, Math.PI * 2)
      c.fillStyle = '#44ff44'
      c.fill()
      c.strokeStyle = '#22aa22'
      c.lineWidth = 2
      c.stroke()
      
      c.setLineDash([5, 5])
      c.beginPath()
      c.moveTo(endEffector.x, endEffector.y)
      c.lineTo(target.x, target.y)
      c.strokeStyle = 'rgba(150, 150, 150, 0.5)'
      c.lineWidth = 1
      c.stroke()
      c.setLineDash([])
    }
    
    function renderMesh(c) {
      if (!meshVertices.value || !skinWeights.value || !bones.value) return
      
      const transformedVertices = meshVertices.value.map(v => {
        if (!v) return { x: 0, y: 0 }
        
        let x = v.x
        let y = v.y
        let deformX = 0
        let deformY = 0
        
        const weights = skinWeights.value.filter(w => w && w.vertex_index === v.vertex_index)
        weights.forEach(w => {
          const bone = bones.value.find(b => b && b.id === w.bone_id)
          if (bone) {
            const world = getBoneWorldPosition(bone, bones.value)
            const localX = (v.x - (bone.x || 0))
            const localY = (v.y - (bone.y || 0))
            const boneAngle = typeof bone.angle === 'number' ? bone.angle : 0
            const rotatedX = localX * Math.cos(world.angle - boneAngle) - localY * Math.sin(world.angle - boneAngle)
            const rotatedY = localX * Math.sin(world.angle - boneAngle) + localY * Math.cos(world.angle - boneAngle)
            const weight = typeof w.weight === 'number' ? w.weight : 0
            deformX += (world.x + rotatedX - v.x) * weight
            deformY += (world.y + rotatedY - v.y) * weight
          }
        })
        
        return { x: x + deformX, y: y + deformY }
      })
      
      if (transformedVertices.length >= 3) {
        c.beginPath()
        c.moveTo(transformedVertices[0].x, transformedVertices[0].y)
        for (let i = 1; i < transformedVertices.length; i++) {
          c.lineTo(transformedVertices[i].x, transformedVertices[i].y)
        }
        c.closePath()
        c.fillStyle = 'rgba(100, 200, 255, 0.3)'
        c.fill()
        c.strokeStyle = '#4a90d9'
        c.lineWidth = 2
        c.stroke()
        
        transformedVertices.forEach(v => {
          c.beginPath()
          c.arc(v.x, v.y, 3, 0, Math.PI * 2)
          c.fillStyle = '#666'
          c.fill()
        })
      }
    }
    
    function onMouseDown(e) {
      const rect = canvas.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const target = targetPosition.value
      const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2)
      if (dist < 20) {
        dragging.value = 'target'
        return
      }
      
      for (const bone of bones.value) {
        const world = getBoneWorldPosition(bone, bones.value)
        const boneDist = Math.sqrt((x - world.x) ** 2 + (y - world.y) ** 2)
        if (boneDist < 15) {
          selectBone(bone.id)
          dragging.value = 'bone'
          return
        }
      }
      
      selectBone(null)
    }
    
    function onMouseMove(e) {
      if (!dragging.value) return
      
      const rect = canvas.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      if (dragging.value === 'target') {
        store.commit('SET_TARGET', { x, y })
        if (autoSolve.value) {
          solve()
        }
      }
    }
    
    function onMouseUp() {
      dragging.value = null
    }
    
    function selectBone(boneId) {
      store.commit('SELECT_BONE', boneId)
    }
    
    function isViolating(boneId) {
      return constraintViolations.value.some(v => v.boneId === boneId)
    }
    
    function onSolverChange() {
      store.commit('SET_SOLVER_TYPE', solverType.value)
    }
    
    function solve() {
      const bonesData = JSON.parse(JSON.stringify(bones.value))
      const skeleton = new Skeleton(bonesData)
      
      let solver
      if (solverType.value === 'ccd') {
        solver = new CCDSolver(skeleton)
      } else {
        solver = new FABRIKSolver(skeleton)
      }
      
      solver.setParams(maxIterations.value, threshold.value)
      const result = solver.solve(targetPosition.value)
      
      Object.keys(result.boneAngles).forEach(boneId => {
        store.commit('UPDATE_BONE', { id: boneId, data: { angle: result.boneAngles[boneId] } })
      })
      
      store.commit('SET_SOLVE_RESULT', result)
    }
    
    function loadPreset(name) {
      const presets = {
        leg: [
          { id: 'hip', x: 300, y: 150, length: 80, angle: 0.5, parentId: null, constraint: { min: -1, max: 1 } },
          { id: 'knee', x: 0, y: 0, length: 70, angle: 0.3, parentId: 'hip', constraint: { min: 0, max: 1.5 } },
          { id: 'ankle', x: 0, y: 0, length: 30, angle: -0.2, parentId: 'knee', constraint: { min: -0.5, max: 0.5 } }
        ],
        arm: [
          { id: 'base', x: 200, y: 300, length: 100, angle: 0, parentId: null, constraint: { min: -2, max: 2 } },
          { id: 'elbow', x: 0, y: 0, length: 80, angle: 0.5, parentId: 'base', constraint: { min: -1.5, max: 1.5 } },
          { id: 'wrist', x: 0, y: 0, length: 40, angle: 0.3, parentId: 'elbow', constraint: { min: -1, max: 1 } }
        ],
        tentacle: [
          { id: 'root', x: 150, y: 300, length: 60, angle: 0.2, parentId: null, constraint: { min: -0.3, max: 0.3 } },
          { id: 'seg1', x: 0, y: 0, length: 50, angle: 0.2, parentId: 'root', constraint: { min: -0.3, max: 0.3 } },
          { id: 'seg2', x: 0, y: 0, length: 40, angle: 0.2, parentId: 'seg1', constraint: { min: -0.3, max: 0.3 } },
          { id: 'seg3', x: 0, y: 0, length: 30, angle: 0.2, parentId: 'seg2', constraint: { min: -0.3, max: 0.3 } },
          { id: 'tip', x: 0, y: 0, length: 20, angle: 0.2, parentId: 'seg3', constraint: { min: -0.3, max: 0.3 } }
        ],
        skin_weights: [
          { id: 'bone1', x: 250, y: 250, length: 100, angle: 0, parentId: null, constraint: { min: -2, max: 2 } },
          { id: 'bone2', x: 0, y: 0, length: 80, angle: 0.5, parentId: 'bone1', constraint: { min: -1.5, max: 1.5 } }
        ]
      }
      
      store.commit('SET_BONES', presets[name] || [])
      store.commit('CLEAR_TRAIL')
      lastAngles.value = {}
      
      if (name === 'skin_weights') {
        generateMesh()
      }
    }
    
    function generateMesh() {
      const vertices = []
      const weights = []
      const size = 150
      const segments = 10
      
      for (let i = 0; i <= segments; i++) {
        for (let j = 0; j <= segments; j++) {
          const x = 200 + (i / segments) * size
          const y = 200 + (j / segments) * size
          vertices.push({ vertex_index: vertices.length, x, y })
        }
      }
      
      vertices.forEach((v, i) => {
        const dist1 = Math.abs(v.x - 250)
        const dist2 = Math.abs(v.x - 350)
        const total = dist1 + dist2
        let w1 = dist2 / total
        let w2 = dist1 / total
        
        if (i % 10 < 3) {
          w1 = 0.95
          w2 = 0.05
        } else if (i % 10 > 7) {
          w1 = 0.05
          w2 = 0.95
        }
        
        weights.push({ vertex_index: i, bone_id: 'bone1', weight: w1 })
        weights.push({ vertex_index: i, bone_id: 'bone2', weight: w2 })
      })
      
      store.commit('SET_MESH_VERTICES', vertices)
      store.commit('SET_SKIN_WEIGHTS', weights)
    }
    
    function generateExtremeWeights() {
      const weights = []
      meshVertices.value.forEach((v, i) => {
        const extreme = Math.random() > 0.5
        weights.push({ vertex_index: i, bone_id: 'bone1', weight: extreme ? 0.99 : 0.01 })
        weights.push({ vertex_index: i, bone_id: 'bone2', weight: extreme ? 0.01 : 0.99 })
      })
      store.commit('SET_SKIN_WEIGHTS', weights)
    }
    
    function toggleMesh() {
      showMesh.value = !showMesh.value
    }
    
    function togglePlay() {
      store.commit('SET_IS_PLAYING', !isPlaying.value)
    }
    
    function addKeyframe() {
      store.dispatch('saveKeyframe', { frameNumber: currentFrame.value })
    }
    
    function animate() {
      const endEffector = getEndEffector()
      store.commit('ADD_TRAIL_POINT', { ...endEffector })
      
      if (isPlaying.value && keyframes.value && keyframes.value.length >= 2) {
        let frame = (currentFrame.value || 0) + (animationSpeed.value || 1)
        if (frame > 100) frame = 0
        store.commit('SET_CURRENT_FRAME', frame)
        
        const sortedKeyframes = [...keyframes.value]
          .filter(kf => kf && typeof kf.frame_number === 'number')
          .sort((a, b) => a.frame_number - b.frame_number)
        
        if (sortedKeyframes.length < 2) return
        
        let prevKf = sortedKeyframes[0]
        let nextKf = sortedKeyframes[sortedKeyframes.length - 1]
        
        for (let i = 0; i < sortedKeyframes.length - 1; i++) {
          if (sortedKeyframes[i].frame_number <= frame && sortedKeyframes[i + 1].frame_number >= frame) {
            prevKf = sortedKeyframes[i]
            nextKf = sortedKeyframes[i + 1]
            break
          }
        }
        
        const t = (frame - prevKf.frame_number) / ((nextKf.frame_number - prevKf.frame_number) || 1)
        const smoothT = t * t * (3 - 2 * t)
        
        if (bones.value) {
          bones.value.forEach(bone => {
            if (!bone || !bone.id) return
            
            const prevAngle = typeof prevKf.bones_angles?.[bone.id] === 'number' ? prevKf.bones_angles[bone.id] : (bone.angle || 0)
            const nextAngle = typeof nextKf.bones_angles?.[bone.id] === 'number' ? nextKf.bones_angles[bone.id] : (bone.angle || 0)
            const interpolated = prevAngle + (nextAngle - prevAngle) * smoothT
            
            const lastAngle = typeof lastAngles.value[bone.id] === 'number' ? lastAngles.value[bone.id] : interpolated
            const velocity = (interpolated - lastAngle) * (springStiffness.value || 0.1)
            const dampedVelocity = velocity * (springDamping.value || 0.8)
            
            store.commit('UPDATE_BONE', { id: bone.id, data: { angle: lastAngle + dampedVelocity } })
            lastAngles.value[bone.id] = lastAngle + dampedVelocity
          })
        }
      }
      
      render()
      animationFrame.value = requestAnimationFrame(animate)
    }
    
    watch([solverType, maxIterations, threshold], () => {
      store.commit('SET_SOLVER_TYPE', solverType.value)
      store.commit('SET_MAX_ITERATIONS', maxIterations.value)
      store.commit('SET_THRESHOLD', threshold.value)
    })
    
    onMounted(() => {
      initCanvas()
      loadPreset('leg')
      animate()
      
      window.addEventListener('resize', initCanvas)
    })
    
    onUnmounted(() => {
      if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value)
      }
      window.removeEventListener('resize', initCanvas)
    })
    
    return {
      canvas,
      activeTab,
      autoSolve,
      showMesh,
      bones,
      selectedBone,
      selectedBoneData,
      targetPosition,
      solverType,
      maxIterations,
      threshold,
      solveResult,
      errorHistory,
      constraintViolations,
      displayErrors,
      maxError,
      keyframes,
      currentFrame,
      isPlaying,
      animationSpeed,
      springDamping,
      springStiffness,
      trailPath,
      meshVertices,
      skinWeights,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      selectBone,
      isViolating,
      onSolverChange,
      solve,
      loadPreset,
      generateMesh,
      generateExtremeWeights,
      toggleMesh,
      togglePlay,
      addKeyframe
    }
  }
}
</script>

<style scoped>
.editor-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  padding: 20px;
}

canvas {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
}

.trajectory-indicator {
  position: absolute;
  bottom: 30px;
  left: 30px;
  background: rgba(100, 150, 255, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.sidebar {
  width: 380px;
  background: white;
  padding: 20px;
  overflow-y: auto;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
}

.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-panel {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-item .label {
  color: #666;
}

.result-item .value {
  font-weight: bold;
}

.value.success {
  color: #4caf50;
}

.value.fail {
  color: #f44336;
}

.value.violation {
  color: #ff9800;
}

.error-chart {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.chart-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.bars-container {
  display: flex;
  align-items: flex-end;
  height: 80px;
  gap: 2px;
}

.error-bar {
  flex: 1;
  background: linear-gradient(to top, #4a90d9, #7ab8ff);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}

.bone-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.bone-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.bone-item:hover {
  background: #e8f0fe;
}

.bone-item.selected {
  background: #4a90d9;
  color: white;
}

.bone-item.violating {
  animation: flash 0.5s infinite;
}

@keyframes flash {
  0%, 100% { background: #ffebee; }
  50% { background: #ffcdd2; }
}

.bone-name {
  font-weight: bold;
}

.bone-length {
  color: #999;
  font-size: 12px;
}

.bone-editor {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.timeline {
  margin-top: 20px;
}

.timeline-track {
  position: relative;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  margin-bottom: 10px;
}

.keyframe-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #ff6b6b;
  border-radius: 50%;
}

.frame-slider {
  width: 100%;
}

.skin-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.weight-info {
  padding: 10px;
  background: #e8f5e9;
  border-radius: 4px;
  color: #2e7d32;
  font-size: 14px;
}
</style>
