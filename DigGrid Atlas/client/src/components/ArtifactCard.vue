<template>
  <Transition name="card">
    <div class="artifact-card-overlay" @click.self="$emit('close')">
      <div class="artifact-card">
        <div class="card-header">
          <div class="header-left">
            <div class="artifact-icon" :style="{ backgroundColor: getArtifactColor(artifact.type) }">
              <el-icon>{{ getArtifactIcon(artifact.type) }}</el-icon>
            </div>
            <div>
              <h3>{{ artifact.code }}</h3>
              <el-tag :type="getTagType(artifact.type)" size="small">
                {{ getArtifactTypeName(artifact.type) }}
              </el-tag>
            </div>
          </div>
          <el-button type="danger" link @click="$emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <el-divider />

        <div class="card-content">
          <el-form :model="form" label-width="80px">
            <el-form-item label="名称">
              <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="陶片" value="pottery" />
                <el-option label="骨骼" value="bone" />
                <el-option label="铜器" value="copper" />
                <el-option label="石器" value="stone" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请输入文物描述"
              />
            </el-form-item>
            <el-divider content-position="left">出土位置</el-divider>
            <el-form-item label="X坐标">
              <el-input-number v-model="form.position_x" :precision="3" :step="0.1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Y坐标">
              <el-input-number v-model="form.position_y" :precision="3" :step="0.1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Z坐标">
              <el-input-number v-model="form.position_z" :precision="3" :step="0.1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="已发现" value="found" />
                <el-option label="已清理" value="cleaned" />
                <el-option label="已提取" value="extracted" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <el-divider />

        <div class="card-footer">
          <el-button type="danger" @click="handleDelete">
            <el-icon><Delete /></el-icon> 删除文物
          </el-button>
          <div class="footer-right">
            <el-button @click="$emit('close')">取消</el-button>
            <el-button type="primary" @click="handleUpdate">
              <el-icon><Check /></el-icon> 保存
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  artifact: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'update', 'delete'])

const form = ref({
  name: '',
  type: 'pottery',
  description: '',
  position_x: 0,
  position_y: 0,
  position_z: 0,
  status: 'found'
})

watch(() => props.artifact, (newVal) => {
  if (newVal) {
    form.value = {
      name: newVal.name || '',
      type: newVal.type || 'pottery',
      description: newVal.description || '',
      position_x: newVal.position_x || 0,
      position_y: newVal.position_y || 0,
      position_z: newVal.position_z || 0,
      status: newVal.status || 'found'
    }
  }
}, { immediate: true })

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

function getTagType(type) {
  const types = {
    pottery: 'warning',
    bone: 'danger',
    copper: 'info',
    stone: '',
    other: 'primary'
  }
  return types[type] || ''
}

function handleUpdate() {
  emit('update', {
    name: form.value.name,
    type: form.value.type,
    description: form.value.description,
    position_x: form.value.position_x,
    position_y: form.value.position_y,
    position_z: form.value.position_z,
    status: form.value.status
  })
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      '确定要删除此文物吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('delete')
  } catch (error) {
    if (error !== 'cancel') {
      throw error
    }
  }
}
</script>

<style scoped>
.artifact-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.artifact-card {
  background: white;
  width: 480px;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.artifact-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.header-left h3 {
  margin: 0 0 5px 0;
  color: white;
  font-size: 20px;
}

.card-content {
  padding: 0 20px;
  overflow-y: auto;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 1px solid #e4e7ed;
}

.footer-right {
  display: flex;
  gap: 10px;
}

.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease;
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
}

.card-enter-from .artifact-card,
.card-leave-to .artifact-card {
  transform: scale(0.9) translateY(20px);
}
</style>