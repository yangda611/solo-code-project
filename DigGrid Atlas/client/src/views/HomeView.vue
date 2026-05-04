<template>
  <div class="home-container">
    <header class="header">
      <h1>考古探方发掘管理系统</h1>
      <p>Archaeological Excavation Management System</p>
    </header>

    <main class="main-content">
      <div class="action-section">
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Document /></el-icon> 探方管理</span>
            </div>
          </template>
          <div class="card-content">
            <p>查看和管理已创建的考古探方</p>
            <el-button type="primary" size="large" @click="goToSquares">
              进入探方列表
            </el-button>
          </div>
        </el-card>

        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Collection /></el-icon> 快速开始</span>
            </div>
          </template>
          <div class="card-content">
            <p>使用预设场景快速开始发掘练习</p>
            <el-button type="success" size="large" @click="showPresetDialog = true">
              选择预设场景
            </el-button>
          </div>
        </el-card>

        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Plus /></el-icon> 创建新探方</span>
            </div>
          </template>
          <div class="card-content">
            <p>创建一个全新的考古探方</p>
            <el-button type="warning" size="large" @click="showCreateDialog = true">
              创建探方
            </el-button>
          </div>
        </el-card>
      </div>

      <div class="info-section">
        <el-card>
          <template #header>
            <span><el-icon><InfoFilled /></el-icon> 系统功能介绍</span>
          </template>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon><View /></el-icon>
              <div>
                <h4>3D 土层可视化</h4>
                <p>使用 Three.js 渲染真实的考古探方土层模型</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon><Promotion /></el-icon>
              <div>
                <h4>逐层剥离动画</h4>
                <p>模拟真实的考古发掘过程，支持动画效果</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon><Coin /></el-icon>
              <div>
                <h4>文物标记管理</h4>
                <p>支持陶片、骨骼、铜器、石器等多种文物类型</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon><DataLine /></el-icon>
              <div>
                <h4>遗迹边界绘制</h4>
                <p>支持标记墓葬、灰坑、房基等遗迹边界</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon><Ruler /></el-icon>
              <div>
                <h4>测量工具</h4>
                <p>内置距离测量功能，精确记录出土位置</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon><Notebook /></el-icon>
              <div>
                <h4>发掘日志</h4>
                <p>完整记录发掘过程，支持日志管理</p>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </main>

    <el-dialog
      v-model="showPresetDialog"
      title="选择预设场景"
      width="600px"
    >
      <div class="preset-list">
        <div
          v-for="preset in presets"
          :key="preset.id"
          class="preset-item"
          @click="selectPreset(preset)"
          :class="{ active: selectedPreset?.id === preset.id }"
        >
          <div class="preset-icon" :style="{ backgroundColor: getPresetColor(preset.code) }">
            <el-icon><Box /></el-icon>
          </div>
          <div class="preset-info">
            <h4>{{ preset.name }}</h4>
            <p>{{ preset.description }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPresetDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedPreset" @click="applyPreset">
          开始发掘
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showCreateDialog"
      title="创建新探方"
      width="500px"
    >
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="探方名称" required>
          <el-input v-model="createForm.name" placeholder="请输入探方名称" />
        </el-form-item>
        <el-form-item label="探方编号" required>
          <el-input v-model="createForm.code" placeholder="请输入探方编号，如 T1" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="请输入探方描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createSquare">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSquareStore } from '@/stores/squareStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const squareStore = useSquareStore()

const showPresetDialog = ref(false)
const showCreateDialog = ref(false)
const selectedPreset = ref(null)
const creating = ref(false)
const presets = ref([])

const createForm = ref({
  name: '',
  code: '',
  description: ''
})

onMounted(async () => {
  await squareStore.fetchPresets()
  presets.value = squareStore.presets
})

function goToSquares() {
  router.push('/squares')
}

function getPresetColor(code) {
  const colors = {
    'complete-tomb': '#667eea',
    'chaotic-layers': '#f093fb',
    'mislabeled-artifacts': '#4facfe',
    'standard-teaching': '#43e97b'
  }
  return colors[code] || '#667eea'
}

function selectPreset(preset) {
  selectedPreset.value = preset
}

async function applyPreset() {
  if (!selectedPreset.value) return
  
  try {
    const result = await squareStore.applyPreset(selectedPreset.value.code)
    ElMessage.success('预设应用成功')
    showPresetDialog.value = false
    router.push(`/excavation/${result.square_id}`)
  } catch (error) {
    ElMessage.error('应用预设失败')
  }
}

async function createSquare() {
  if (!createForm.value.name || !createForm.value.code) {
    ElMessage.warning('请填写探方名称和编号')
    return
  }
  
  creating.value = true
  try {
    const result = await squareStore.createSquare(createForm.value)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createForm.value = { name: '', code: '', description: '' }
    router.push(`/excavation/${result.id}`)
  } catch (error) {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  text-align: center;
  color: white;
  padding: 40px 0;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.action-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.action-card {
  text-align: center;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-content {
  padding: 20px 0;
}

.card-content p {
  color: #606266;
  margin-bottom: 20px;
}

.info-section {
  margin-top: 30px;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.feature-item:hover {
  background: #e4e7ed;
  transform: translateY(-2px);
}

.feature-item .el-icon {
  font-size: 32px;
  color: #667eea;
}

.feature-item h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.feature-item p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.preset-list {
  max-height: 400px;
  overflow-y: auto;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.preset-item:hover {
  border-color: #667eea;
}

.preset-item.active {
  border-color: #667eea;
  background: #f0f2ff;
}

.preset-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.preset-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.preset-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

@media (max-width: 900px) {
  .action-section {
    grid-template-columns: 1fr;
  }
  
  .feature-list {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .feature-list {
    grid-template-columns: 1fr;
  }
}
</style>