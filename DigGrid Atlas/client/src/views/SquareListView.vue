<template>
  <div class="squares-container">
    <header class="page-header">
      <div class="header-left">
        <el-button @click="goBack" link>
          <el-icon><ArrowLeft /></el-icon> 返回首页
        </el-button>
        <h2>探方列表</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon> 新建探方
        </el-button>
      </div>
    </header>

    <main class="main-content">
      <el-card v-loading="squareStore.loading">
        <el-table :data="squareStore.squares" style="width: 100%">
          <el-table-column prop="code" label="探方编号" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="enterExcavation(row)">
                进入发掘
              </el-button>
              <el-button type="info" size="small" @click="viewLogs(row)">
                日志
              </el-button>
              <el-button type="danger" size="small" @click="deleteSquare(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="squareStore.squares.length === 0" description="暂无探方数据" />
      </el-card>
    </main>

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

    <el-dialog
      v-model="showPresetDialog"
      title="选择预设场景"
      width="600px"
    >
      <div class="preset-list">
        <div
          v-for="preset in squareStore.presets"
          :key="preset.id"
          class="preset-item"
          @click="selectedPreset = preset"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const squareStore = useSquareStore()

const showCreateDialog = ref(false)
const showPresetDialog = ref(false)
const selectedPreset = ref(null)
const creating = ref(false)

const createForm = ref({
  name: '',
  code: '',
  description: ''
})

onMounted(() => {
  squareStore.fetchSquares()
  squareStore.fetchPresets()
})

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function goBack() {
  router.push('/')
}

function enterExcavation(row) {
  router.push(`/excavation/${row.id}`)
}

function viewLogs(row) {
  router.push(`/logs/${row.id}`)
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

async function deleteSquare(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除探方 "${row.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await squareStore.deleteSquare(row.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
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
  } catch (error) {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

async function applyPreset() {
  if (!selectedPreset.value) return
  
  try {
    await squareStore.applyPreset(selectedPreset.value.code)
    ElMessage.success('预设应用成功')
    showPresetDialog.value = false
    selectedPreset.value = null
  } catch (error) {
    ElMessage.error('应用预设失败')
  }
}
</script>

<style scoped>
.squares-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
}

.main-content {
  padding: 20px;
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
</style>