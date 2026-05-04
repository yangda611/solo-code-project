<template>
  <div class="logs-container">
    <header class="page-header">
      <div class="header-left">
        <el-button @click="goBack" link>
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2>发掘日志</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Edit /></el-icon> 添加日志
        </el-button>
      </div>
    </header>

    <main class="main-content">
      <el-card v-loading="loading">
        <template #header>
          <div class="card-header">
            <span>探方: {{ excavationStore.squareInfo?.name || '未知' }}</span>
            <span>编号: {{ excavationStore.squareInfo?.code || '未知' }}</span>
          </div>
        </template>

        <div class="logs-list" v-if="excavationStore.logs.length > 0">
          <div
            v-for="log in excavationStore.logs"
            :key="log.id"
            class="log-item"
          >
            <div class="log-time">
              <el-icon><TimeFilled /></el-icon>
              {{ formatDate(log.created_at) }}
            </div>
            <div class="log-content">
              <h4>{{ log.title }}</h4>
              <p>{{ log.content }}</p>
            </div>
            <div class="log-actions">
              <el-button type="danger" size="small" link @click="deleteLog(log)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无日志记录" />
      </el-card>
    </main>

    <el-dialog
      v-model="showAddDialog"
      title="添加发掘日志"
      width="500px"
    >
      <el-form :model="logForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="logForm.title" placeholder="请输入日志标题" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="logForm.content"
            type="textarea"
            placeholder="请输入日志内容"
            :rows="6"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="addLog">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExcavationStore } from '@/stores/excavationStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const excavationStore = useExcavationStore()

const loading = ref(false)
const showAddDialog = ref(false)
const saving = ref(false)

const logForm = ref({
  title: '',
  content: ''
})

onMounted(async () => {
  const squareId = route.params.id
  if (squareId) {
    loading.value = true
    try {
      await excavationStore.loadSquare(squareId)
    } finally {
      loading.value = false
    }
  }
})

onUnmounted(() => {
  excavationStore.reset()
})

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function goBack() {
  router.back()
}

async function addLog() {
  if (!logForm.value.title || !logForm.value.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  
  saving.value = true
  try {
    await excavationStore.addLog(logForm.value.title, logForm.value.content)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    logForm.value = { title: '', content: '' }
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    saving.value = false
  }
}

async function deleteLog(log) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条日志吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    excavationStore.logs = excavationStore.logs.filter(l => l.id !== log.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.logs-container {
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

.card-header {
  display: flex;
  gap: 30px;
  color: #606266;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.log-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.log-item:hover {
  background: #e4e7ed;
}

.log-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
}

.log-content {
  flex: 1;
}

.log-content h4 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 15px;
}

.log-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.log-actions {
  display: flex;
  align-items: flex-start;
}
</style>