<template>
  <div class="excavation-container">
    <header class="page-header">
      <div class="header-left">
        <el-button @click="goBack" link>
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="square-info">
          <h2>{{ excavationStore.squareInfo?.name || '探方发掘' }}</h2>
          <span class="square-code">{{ excavationStore.squareInfo?.code }}</span>
        </div>
      </div>
      <div class="header-center">
        <div class="layer-info">
          <span>当前土层: {{ excavationStore.currentLayer?.name || '无' }}</span>
          <span class="divider">|</span>
          <span>已剥离: {{ excavationStore.strippedLayers.length }} / {{ excavationStore.layers.length }} 层</span>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="goToLogs">
          <el-icon><Notebook /></el-icon> 发掘日志
        </el-button>
      </div>
    </header>

    <div class="main-layout">
      <aside class="tool-panel">
        <el-card>
          <template #header>
            <span><el-icon><Tools /></el-icon> 工具</span>
          </template>
          <div class="tool-list">
            <el-button
              :type="excavationStore.toolMode === 'select' ? 'primary' : 'default'"
              @click="excavationStore.toolMode = 'select'"
              class="tool-btn"
            >
              <el-icon><Pointer /></el-icon>
              <span>选择</span>
            </el-button>
            <el-button
              :type="excavationStore.toolMode === 'strip' ? 'primary' : 'default'"
              @click="excavationStore.toolMode = 'strip'"
              :disabled="excavationStore.isStripping || excavationStore.currentLayerIndex >= excavationStore.layers.length"
              class="tool-btn"
            >
              <el-icon><Promotion /></el-icon>
              <span>剥离土层</span>
            </el-button>
            <el-button
              :type="excavationStore.toolMode === 'mark' ? 'primary' : 'default'"
              @click="excavationStore.toolMode = 'mark'"
              class="tool-btn"
            >
              <el-icon><Coin /></el-icon>
              <span>标记文物</span>
            </el-button>
            <el-button
              :type="excavationStore.toolMode === 'boundary' ? 'primary' : 'default'"
              @click="startBoundaryMode"
              class="tool-btn"
            >
              <el-icon><Connection /></el-icon>
              <span>绘制边界</span>
            </el-button>
            <el-button
              :type="excavationStore.toolMode === 'measure' ? 'primary' : 'default'"
              @click="startMeasureMode"
              class="tool-btn"
            >
              <el-icon><Ruler /></el-icon>
              <span>测量距离</span>
            </el-button>
          </div>
        </el-card>

        <el-card v-if="excavationStore.toolMode === 'mark'" class="tool-config">
          <template #header>
            <span>文物类型</span>
          </template>
          <div class="artifact-types">
            <el-radio-group v-model="selectedArtifactType" size="large">
              <el-radio-button label="pottery">
                <el-icon><Tea /></el-icon> 陶片
              </el-radio-button>
              <el-radio-button label="bone">
                <el-icon><User /></el-icon> 骨骼
              </el-radio-button>
              <el-radio-button label="copper">
                <el-icon><Coin /></el-icon> 铜器
              </el-radio-button>
              <el-radio-button label="stone">
                <el-icon><Diamond /></el-icon> 石器
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-card>

        <el-card v-if="excavationStore.toolMode === 'boundary'" class="tool-config">
          <template #header>
            <span>边界绘制</span>
          </template>
          <div class="boundary-config">
            <el-form :model="boundaryForm" label-width="80px">
              <el-form-item label="名称">
                <el-input v-model="boundaryForm.name" placeholder="请输入边界名称" />
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="boundaryForm.type" placeholder="请选择类型" style="width: 100%">
                  <el-option label="遗迹" value="relic" />
                  <el-option label="墓葬" value="tomb" />
                  <el-option label="灰坑" value="pit" />
                  <el-option label="房基" value="foundation" />
                  <el-option label="墙基" value="wall" />
                </el-select>
              </el-form-item>
              <el-form-item label="颜色">
                <el-color-picker v-model="boundaryForm.color" />
              </el-form-item>
            </el-form>
            <div class="boundary-actions">
              <el-button type="primary" :disabled="!excavationStore.isDrawingBoundary" @click="finishBoundary">
                完成绘制
              </el-button>
              <el-button @click="cancelBoundary">取消</el-button>
            </div>
            <p class="hint">点击场景添加顶点，至少需要3个点</p>
          </div>
        </el-card>

        <el-card v-if="excavationStore.toolMode === 'measure'" class="tool-config">
          <template #header>
            <span>测量信息</span>
          </template>
          <div class="measure-info">
            <div v-if="excavationStore.measurementStart && !excavationStore.measurementEnd">
              <p>起点: ({{ excavationStore.measurementStart.x.toFixed(2) }}, {{ excavationStore.measurementStart.y.toFixed(2) }}, {{ excavationStore.measurementStart.z.toFixed(2) }})</p>
              <p class="hint">点击第二个点完成测量</p>
            </div>
            <div v-else-if="excavationStore.measurementStart && excavationStore.measurementEnd">
              <p>起点: ({{ excavationStore.measurementStart.x.toFixed(2) }}, {{ excavationStore.measurementStart.y.toFixed(2) }}, {{ excavationStore.measurementStart.z.toFixed(2) }})</p>
              <p>终点: ({{ excavationStore.measurementEnd.x.toFixed(2) }}, {{ excavationStore.measurementEnd.y.toFixed(2) }}, {{ excavationStore.measurementEnd.z.toFixed(2) }})</p>
              <p class="distance">距离: {{ measureDistance.toFixed(3) }} 米</p>
            </div>
            <el-button size="small" @click="clearMeasure">清除测量</el-button>
          </div>
        </el-card>
      </aside>

      <main class="scene-area">
        <Scene3D
          :layers="excavationStore.layers"
          :artifacts="excavationStore.visibleArtifacts"
          :boundaries="excavationStore.boundaries"
          :tool-mode="excavationStore.toolMode"
          :is-stripping="excavationStore.isStripping"
          :current-layer-index="excavationStore.currentLayerIndex"
          :measurement-start="excavationStore.measurementStart"
          :measurement-end="excavationStore.measurementEnd"
          :boundary-points="excavationStore.boundaryPoints"
          :is-drawing-boundary="excavationStore.isDrawingBoundary"
          :selected-artifact="excavationStore.selectedArtifact"
          @strip-layer="handleStripLayer"
          @mark-artifact="handleMarkArtifact"
          @select-artifact="handleSelectArtifact"
          @add-boundary-point="handleAddBoundaryPoint"
          @measure-point="handleMeasurePoint"
        />
      </main>

      <aside class="info-panel">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="土层" name="layers">
            <el-card class="layers-card">
              <div class="layers-list">
                <div
                  v-for="(layer, index) in excavationStore.layers"
                  :key="layer.id"
                  class="layer-item"
                  :class="{ 
                    stripped: layer.is_stripped === 1, 
                    current: index === excavationStore.currentLayerIndex 
                  }"
                >
                  <div class="layer-color" :style="{ backgroundColor: layer.color }"></div>
                  <div class="layer-info">
                    <div class="layer-name">{{ layer.name }}</div>
                    <div class="layer-depth">深度: {{ layer.depth_start }}m - {{ layer.depth_end }}m</div>
                  </div>
                  <div class="layer-status">
                    <el-tag v-if="layer.is_stripped === 1" type="success" size="small">已剥离</el-tag>
                    <el-tag v-else-if="index === excavationStore.currentLayerIndex" type="primary" size="small">当前</el-tag>
                    <el-tag v-else type="info" size="small">待发掘</el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="文物" name="artifacts">
            <el-card class="artifacts-card">
              <div class="artifacts-list">
                <div
                  v-for="artifact in excavationStore.visibleArtifacts"
                  :key="artifact.id"
                  class="artifact-item"
                  :class="{ active: excavationStore.selectedArtifact?.id === artifact.id }"
                  @click="excavationStore.selectedArtifact = artifact"
                >
                  <div class="artifact-icon" :style="{ backgroundColor: getArtifactColor(artifact.type) }">
                    <el-icon>{{ getArtifactIcon(artifact.type) }}</el-icon>
                  </div>
                  <div class="artifact-info">
                    <div class="artifact-code">{{ artifact.code }}</div>
                    <div class="artifact-name">{{ artifact.name || getArtifactTypeName(artifact.type) }}</div>
                  </div>
                </div>
              </div>
              <el-empty v-if="excavationStore.visibleArtifacts.length === 0" description="暂无可见文物" :image-size="60" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="遗迹" name="boundaries">
            <el-card class="boundaries-card">
              <div class="boundaries-list">
                <div
                  v-for="boundary in excavationStore.boundaries"
                  :key="boundary.id"
                  class="boundary-item"
                >
                  <div class="boundary-color" :style="{ backgroundColor: boundary.color }"></div>
                  <div class="boundary-info">
                    <div class="boundary-name">{{ boundary.name }}</div>
                    <div class="boundary-type">{{ getBoundaryTypeName(boundary.type) }}</div>
                  </div>
                </div>
              </div>
              <el-empty v-if="excavationStore.boundaries.length === 0" description="暂无遗迹边界" :image-size="60" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </aside>
    </div>

    <ArtifacCard
      v-if="showArtifactCard"
      :artifact="excavationStore.selectedArtifact"
      @close="showArtifactCard = false"
      @update="handleUpdateArtifact"
      @delete="handleDeleteArtifact"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExcavationStore } from '@/stores/excavationStore'
import Scene3D from '@/components/Scene3D.vue'
import ArtifacCard from '@/components/ArtifactCard.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const excavationStore = useExcavationStore()

const activeTab = ref('layers')
const showArtifactCard = ref(false)
const selectedArtifactType = ref('pottery')

const boundaryForm = ref({
  name: '',
  type: 'relic',
  color: '#FF4444'
})

const measureDistance = computed(() => {
  if (!excavationStore.measurementStart || !excavationStore.measurementEnd) return 0
  const dx = excavationStore.measurementEnd.x - excavationStore.measurementStart.x
  const dy = excavationStore.measurementEnd.y - excavationStore.measurementStart.y
  const dz = excavationStore.measurementEnd.z - excavationStore.measurementStart.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
})

onMounted(async () => {
  const squareId = route.params.id
  if (squareId) {
    await excavationStore.loadSquare(squareId)
  }
})

onUnmounted(() => {
  excavationStore.reset()
})

function goBack() {
  router.push('/squares')
}

function goToLogs() {
  router.push(`/logs/${route.params.id}`)
}

function getArtifactColor(type) {
  const colors = {
    pottery: '#E6A23C',
    bone: '#F56C6C',
    copper: '#C0A080',
    stone: '#909399',
    other: '#409EFF'
  }
  return colors[type] || '#409EFF'
}

function getArtifactIcon(type) {
  const icons = {
    pottery: 'Tea',
    bone: 'User',
    copper: 'Coin',
    stone: 'Diamond',
    other: 'Box'
  }
  return icons[type] || 'Box'
}

function getArtifactTypeName(type) {
  const types = {
    pottery: '陶片',
    bone: '骨骼',
    copper: '铜器',
    stone: '石器',
    other: '其他'
  }
  return types[type] || '未知'
}

function getBoundaryTypeName(type) {
  const types = {
    relic: '遗迹',
    tomb: '墓葬',
    pit: '灰坑',
    foundation: '房基',
    wall: '墙基',
    other: '其他'
  }
  return types[type] || '未知'
}

async function handleStripLayer() {
  if (excavationStore.currentLayerIndex >= excavationStore.layers.length) {
    ElMessage.info('所有土层已剥离完毕')
    return
  }
  await excavationStore.stripCurrentLayer()
  ElMessage.success(`成功剥离 ${excavationStore.layers[excavationStore.currentLayerIndex - 1]?.name}`)
}

function handleMarkArtifact(position) {
  const artifactCode = `W${String(excavationStore.artifacts.length + 1).padStart(3, '0')}`
  excavationStore.createArtifact({
    code: artifactCode,
    type: selectedArtifactType.value,
    name: getArtifactTypeName(selectedArtifactType.value),
    position_x: position.x,
    position_y: position.y,
    position_z: position.z
  }).then(() => {
    ElMessage.success(`文物 ${artifactCode} 已标记`)
  }).catch(() => {
    ElMessage.error('标记失败')
  })
}

function handleSelectArtifact(artifact) {
  excavationStore.selectedArtifact = artifact
  showArtifactCard.value = true
}

function startBoundaryMode() {
  excavationStore.toolMode = 'boundary'
  excavationStore.startDrawingBoundary()
}

function handleAddBoundaryPoint(point) {
  excavationStore.addBoundaryPoint(point)
}

async function finishBoundary() {
  if (excavationStore.boundaryPoints.length < 3) {
    ElMessage.warning('至少需要3个点才能创建边界')
    return
  }
  if (!boundaryForm.value.name) {
    ElMessage.warning('请输入边界名称')
    return
  }
  
  try {
    await excavationStore.createBoundary({
      name: boundaryForm.value.name,
      type: boundaryForm.value.type,
      color: boundaryForm.value.color,
      points: excavationStore.boundaryPoints
    })
    ElMessage.success('边界创建成功')
    cancelBoundary()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

function cancelBoundary() {
  excavationStore.cancelDrawingBoundary()
  boundaryForm.value = { name: '', type: 'relic', color: '#FF4444' }
}

function startMeasureMode() {
  excavationStore.toolMode = 'measure'
  excavationStore.clearMeasurement()
}

function handleMeasurePoint(point) {
  if (!excavationStore.measurementStart) {
    excavationStore.startMeasurement(point)
  } else {
    excavationStore.endMeasurement(point)
  }
}

function clearMeasure() {
  excavationStore.clearMeasurement()
}

async function handleUpdateArtifact(data) {
  await excavationStore.updateArtifact(excavationStore.selectedArtifact.id, data)
  ElMessage.success('更新成功')
}

async function handleDeleteArtifact() {
  try {
    await ElMessageBox.confirm('确定要删除此文物吗？', '确认删除', {
      type: 'warning'
    })
    await excavationStore.deleteArtifact(excavationStore.selectedArtifact.id)
    showArtifactCard.value = false
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.excavation-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.square-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.square-info h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.square-code {
  background: #409EFF;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.header-center .layer-info {
  color: #606266;
  font-size: 14px;
}

.header-center .layer-info .divider {
  margin: 0 10px;
  color: #c0c4cc;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.tool-panel {
  width: 280px;
  padding: 15px;
  background: white;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  flex-shrink: 0;
}

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool-btn {
  justify-content: flex-start;
  padding: 12px 16px;
}

.tool-btn .el-icon {
  margin-right: 8px;
}

.tool-config {
  margin-top: 15px;
}

.artifact-types {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.boundary-config .hint,
.measure-info .hint {
  color: #909399;
  font-size: 12px;
  margin-top: 10px;
}

.boundary-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.measure-info .distance {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
  margin-top: 10px;
}

.scene-area {
  flex: 1;
  position: relative;
  background: #1a1a2e;
}

.info-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e4e7ed;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.info-panel :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.info-panel :deep(.el-tab-pane) {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.layers-card,
.artifacts-card,
.boundaries-card {
  height: calc(100vh - 150px);
  overflow-y: auto;
}

.layers-list,
.artifacts-list,
.boundaries-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.layer-item.current {
  background: #ecf5ff;
  border: 1px solid #409EFF;
}

.layer-item.stripped {
  opacity: 0.6;
}

.layer-item.stripped .layer-info {
  text-decoration: line-through;
}

.layer-color {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  flex-shrink: 0;
}

.layer-info {
  flex: 1;
}

.layer-name {
  font-weight: 500;
  color: #303133;
}

.layer-depth {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.artifact-item,
.boundary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
}

.artifact-item:hover,
.boundary-item:hover {
  background: #e4e7ed;
}

.artifact-item.active {
  background: #ecf5ff;
  border: 1px solid #409EFF;
}

.artifact-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.artifact-info,
.boundary-info {
  flex: 1;
}

.artifact-code,
.boundary-name {
  font-weight: 500;
  color: #303133;
}

.artifact-name,
.boundary-type {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.boundary-color {
  width: 12px;
  height: 36px;
  border-radius: 3px;
  flex-shrink: 0;
}
</style>