<template>
  <div class="app-container">
    <div v-if="showWelcome" class="welcome-overlay">
      <h1 class="welcome-title">古生物化石发掘系统</h1>
      <p class="welcome-subtitle">Paleontology Fossil Excavation System</p>
      <p class="loading-status" v-if="loadingStatus">{{ loadingStatus }}</p>
      <p class="error-text" v-if="errorMessage">{{ errorMessage }}</p>
      
      <div class="welcome-presets">
        <div 
          v-for="scene in scenes" 
          :key="scene.id"
          class="welcome-preset-btn"
          @click="loadScene(scene.name)"
        >
          <div class="welcome-preset-name">{{ scene.name }}</div>
          <div class="welcome-preset-desc">{{ scene.description }}</div>
        </div>
      </div>
      
      <div v-if="scenes.length === 0" class="no-scenes">
        <p>正在加载场景列表...</p>
      </div>
    </div>

    <template v-else>
      <div class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-title">预设场景</div>
          <button 
            v-for="scene in scenes" 
            :key="scene.id"
            :class="['preset-btn', { active: currentScene === scene.name }]"
            @click="loadScene(scene.name)"
          >
            {{ scene.name }}
          </button>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">发掘工具</div>
          <button 
            v-for="tool in tools" 
            :key="tool.type"
            :class="['tool-btn', { active: currentTool === tool.type }]"
            @click="selectTool(tool.type)"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
            {{ tool.name }}
          </button>
          
          <div class="intensity-slider">
            <div class="slider-label">
              <span>工具强度</span>
              <span>{{ (toolIntensity * 100).toFixed(0) }}%</span>
            </div>
            <input 
              type="range" 
              class="slider" 
              min="0.1" 
              max="1" 
              step="0.1"
              v-model="toolIntensity"
            />
          </div>
          
          <button 
            class="action-btn secondary"
            @click="excavateNextLayer"
            :disabled="isExcavating"
          >
            {{ isExcavating ? '发掘中...' : '剥离下一层围岩' }}
          </button>
          
          <button 
            class="action-btn"
            @click="useCurrentTool"
            :disabled="!selectedFragment"
          >
            对选中化石使用工具
          </button>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">已发现化石 ({{ discoveredCount }}/{{ totalFragments }})</div>
          <div 
            v-for="(fragment, index) in fragments" 
            :key="fragment.id"
            :class="[
              'fragment-item', 
              { 
                discovered: fragment.discovered,
                selected: selectedFragmentIndex === index,
                damaged: (fragment.erosion_level || 0) > 0.5
              }
            ]"
            @click="selectFragment(index)"
          >
            <div class="fragment-name">
              {{ fragment.discovered ? fragment.name : '???' }}
            </div>
            <div class="fragment-status">
              <template v-if="fragment.discovered">
                {{ getBoneTypeName(fragment.bone_type) }}
                <template v-if="(fragment.erosion_level || 0) > 0.5">
                  · 已损伤
                </template>
                <template v-if="(fragment.weathering_level || 0) > 0.5">
                  · 已酥解
                </template>
              </template>
              <template v-else>
                未发现 - 点击发现
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="top-bar">
          <div class="app-title">虚拟古生物化石发掘与骨骼复原系统</div>
          <div class="status-bar">
            <div class="status-item">
              <span class="status-indicator green"></span>
              场景: {{ currentScene || '未加载' }}
            </div>
            <div class="status-item">
              <span :class="['status-indicator', getStatusColor()]" ></span>
              发掘进度: {{ excavationProgress }}%
            </div>
            <div class="status-item">
              <span :class="['status-indicator', warningActive ? 'red' : 'green']"></span>
              {{ warningActive ? '警告: 化石损伤' : '状态正常' }}
            </div>
          </div>
        </div>

        <div class="scene-container">
          <div ref="canvasContainer" class="canvas-container"></div>

          <div v-if="warningMessage" class="warning-banner">
            ⚠️ {{ warningMessage }}
          </div>

          <div class="right-panel">
            <div class="info-panel">
              <div class="sidebar-title">地层信息</div>
              <div class="info-row">
                <span class="info-label">当前层位</span>
                <span class="info-value">{{ currentLayerInfo?.name || '无' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">年代</span>
                <span class="info-value">{{ currentLayerInfo?.age || 0 }} 百万年前</span>
              </div>
              <div class="info-row">
                <span class="info-label">剥离进度</span>
                <span class="info-value">{{ excavatedLayers }}/{{ totalLayers }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill green"
                  :style="{ width: (excavatedLayers / totalLayers * 100) + '%' }"
                ></div>
              </div>
            </div>

            <div v-if="selectedFragmentData" class="info-panel">
              <div class="sidebar-title">选中化石信息</div>
              <div class="info-row">
                <span class="info-label">名称</span>
                <span class="info-value">{{ selectedFragmentData.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">类型</span>
                <span class="info-value">{{ getBoneTypeName(selectedFragmentData.bone_type) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">位置</span>
                <span class="info-value">
                  ({{ selectedFragmentData.position_x?.toFixed(2) }}, 
                   {{ selectedFragmentData.position_y?.toFixed(2) }}, 
                   {{ selectedFragmentData.position_z?.toFixed(2) }})
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">朝向</span>
                <span class="info-value">
                  ({{ selectedFragmentData.rotation_x?.toFixed(1) }}°,
                   {{ selectedFragmentData.rotation_y?.toFixed(1) }}°,
                   {{ selectedFragmentData.rotation_z?.toFixed(1) }}°)
                </span>
              </div>
              
              <div class="info-row">
                <span class="info-label">损伤度</span>
                <span :class="['info-value', (selectedFragmentData.erosion_level || 0) > 0.5 ? 'danger' : 'success']">
                  {{ ((selectedFragmentData.erosion_level || 0) * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  :class="['progress-fill', (selectedFragmentData.erosion_level || 0) > 0.5 ? 'red' : 'green']"
                  :style="{ width: ((selectedFragmentData.erosion_level || 0) * 100) + '%' }"
                ></div>
              </div>
              
              <div class="info-row">
                <span class="info-label">风化度</span>
                <span :class="['info-value', (selectedFragmentData.weathering_level || 0) > 0.5 ? 'warning' : 'success']">
                  {{ ((selectedFragmentData.weathering_level || 0) * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  :class="['progress-fill', (selectedFragmentData.weathering_level || 0) > 0.5 ? 'yellow' : 'green']"
                  :style="{ width: ((selectedFragmentData.weathering_level || 0) * 100) + '%' }"
                ></div>
              </div>
              
              <div v-if="(selectedFragmentData.coordinate_error_x || 0) !== 0" class="info-row">
                <span class="info-label">坐标偏差</span>
                <span class="info-value warning">存在地层倾斜偏差</span>
              </div>
            </div>

            <div class="info-panel">
              <div class="sidebar-title">骨骼复原</div>
              <div class="info-row">
                <span class="info-label">完成度</span>
                <span :class="['info-value', reconstructionProgress > 70 ? 'success' : 'warning']">
                  {{ reconstructionProgress }}%
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  :class="['progress-fill', reconstructionProgress > 70 ? 'green' : 'yellow']"
                  :style="{ width: reconstructionProgress + '%' }"
                ></div>
              </div>
              
              <button class="action-btn" @click="matchFragments">
                执行碎片匹配
              </button>
              <button class="action-btn secondary" @click="validateBiomechanics">
                生物力学校验
              </button>
              <button 
                class="action-btn success" 
                @click="startWalkAnimation"
                :disabled="reconstructionProgress < 70"
              >
                播放行走动画
              </button>
              <button class="action-btn secondary" @click="applyWeathering">
                模拟风化 (30天)
              </button>
            </div>

            <div class="info-panel">
              <div class="sidebar-title">分析报告</div>
              <div class="info-row">
                <span class="info-label">碎片分析</span>
                <span class="info-value">{{ fragmentationPattern }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">地层倾斜</span>
                <span :class="['info-value', tectonicBias > 0.1 ? 'warning' : 'success']">
                  {{ tectonicBias > 0.1 ? '已检测到偏差' : '正常' }}
                </span>
              </div>
              <button class="action-btn secondary" @click="runAnalysis">
                生成分析报告
              </button>
            </div>
          </div>

          <div class="instructions">
            <kbd>左键</kbd> 选择化石 |
            <kbd>滚轮</kbd> 缩放视角 |
            <kbd>拖动</kbd> 旋转视角 |
            <kbd>右键</kbd> 平移
          </div>
        </div>
      </div>
    </template>

    <div v-if="showAnalysisModal" class="overlay" @click.self="showAnalysisModal = false">
      <div class="modal">
        <h2 class="modal-title">分析报告</h2>
        <div class="modal-content" v-html="analysisContent"></div>
        <div class="modal-buttons">
          <button class="action-btn secondary" @click="showAnalysisModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { sceneService, profileService } from './services/api.js';

let FossilSceneManager = null;

export default {
  name: 'App',
  setup() {
    const canvasContainer = ref(null);
    const sceneManager = ref(null);
    const walkAnimation = ref(null);
    
    const showWelcome = ref(true);
    const scenes = ref([]);
    const currentScene = ref(null);
    const currentProfileId = ref(null);
    const loadingStatus = ref('');
    const errorMessage = ref('');
    
    const tools = ref([
      { type: 'air_chisel', name: '气动笔', icon: '⛏️' },
      { type: 'brush', name: '毛刷', icon: '🖌️' },
      { type: 'chemical', name: '化学试剂', icon: '🧪' }
    ]);
    const currentTool = ref('air_chisel');
    const toolIntensity = ref(0.5);
    
    const fragments = ref([]);
    const layers = ref([]);
    const selectedFragmentIndex = ref(null);
    const selectedFragmentData = ref(null);
    
    const excavatedLayers = ref(0);
    const isExcavating = ref(false);
    
    const warningMessage = ref(null);
    const warningActive = ref(false);
    
    const reconstructionProgress = ref(0);
    const fragmentationPattern = ref('待分析');
    const tectonicBias = ref(0);
    
    const showAnalysisModal = ref(false);
    const analysisContent = ref('');

    const totalFragments = computed(() => fragments.value.length);
    const discoveredCount = computed(() => fragments.value.filter(f => f.discovered).length);
    const totalLayers = computed(() => layers.value.length);
    const excavationProgress = computed(() => 
      Math.round(discoveredCount.value / Math.max(1, totalFragments.value) * 100)
    );
    const currentLayerInfo = computed(() => {
      if (excavatedLayers.value < layers.value.length) {
        return layers.value[excavatedLayers.value];
      }
      return null;
    });

    const getBoneTypeName = (type) => {
      const names = {
        'skull': '头骨',
        'vertebra': '脊椎',
        'limb': '肢骨',
        'rib': '肋骨',
        'pelvis': '骨盆',
        'tooth': '牙齿',
        'tusk': '象牙'
      };
      return names[type] || type;
    };

    const getStatusColor = () => {
      if (excavationProgress.value >= 100) return 'green';
      if (excavationProgress.value >= 50) return 'yellow';
      return 'green';
    };

    const showWarning = (msg, duration = 5000) => {
      warningMessage.value = msg;
      warningActive.value = true;
      setTimeout(() => {
        warningMessage.value = null;
        warningActive.value = false;
      }, duration);
    };

    const loadScenes = async () => {
      loadingStatus.value = '正在加载场景列表...';
      try {
        const res = await sceneService.getAll();
        scenes.value = res.data.scenes || [];
        loadingStatus.value = '';
      } catch (e) {
        console.error('加载场景失败:', e);
        errorMessage.value = '无法连接后端服务，请确保后端已启动';
        loadingStatus.value = '';
      }
    };

    const loadScene = async (sceneName) => {
      errorMessage.value = '';
      loadingStatus.value = '正在加载场景...';
      
      try {
        currentScene.value = sceneName;
        
        if (!FossilSceneManager) {
          loadingStatus.value = '正在初始化3D引擎...';
          try {
            const module = await import('./services/sceneManager.js');
            FossilSceneManager = module.default;
            console.log('FossilSceneManager 加载成功');
          } catch (e) {
            console.error('加载FossilSceneManager失败:', e);
            errorMessage.value = '3D引擎加载失败: ' + e.message;
            loadingStatus.value = '';
            return;
          }
        }
        
        showWelcome.value = false;
        await nextTick();
        
        if (!sceneManager.value) {
          loadingStatus.value = '正在创建3D场景...';
          try {
            const canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvasContainer.value.appendChild(canvas);
            
            sceneManager.value = new FossilSceneManager();
            sceneManager.value.init(canvas);
            
            sceneManager.value.onFragmentSelect = (data) => {
              selectedFragmentData.value = data;
            };
            console.log('3D场景初始化成功');
          } catch (e) {
            console.error('初始化3D场景失败:', e);
            errorMessage.value = '3D场景初始化失败: ' + e.message;
            loadingStatus.value = '';
            return;
          }
        }
        
        loadingStatus.value = '正在加载场景数据...';
        const res = await sceneService.load(sceneName);
        const data = res.data;
        
        currentProfileId.value = data.profileId;
        layers.value = data.layers;
        fragments.value = data.fragments;
        excavatedLayers.value = 0;
        selectedFragmentIndex.value = null;
        selectedFragmentData.value = null;
        reconstructionProgress.value = 0;
        tectonicBias.value = 0;
        fragmentationPattern.value = '待分析';
        
        loadingStatus.value = '正在加载地层模型...';
        await sceneManager.value.loadStratigraphicLayers(data.layers);
        await sceneManager.value.loadFragments(data.fragments);
        
        loadingStatus.value = '';
        setTimeout(() => {
          showWarning(`已加载 ${sceneName}，共 ${fragments.value.length} 个化石碎片等待发掘`);
        }, 500);
        
      } catch (e) {
        console.error('加载场景失败:', e);
        errorMessage.value = '场景加载失败: ' + e.message;
        loadingStatus.value = '';
      }
    };

    const selectTool = (toolType) => {
      currentTool.value = toolType;
    };

    const selectFragment = (index) => {
      const fragment = fragments.value[index];
      
      if (!fragment.discovered) {
        discoverFragment(index);
        return;
      }
      
      selectedFragmentIndex.value = index;
      selectedFragmentData.value = fragment;
      if (sceneManager.value) {
        sceneManager.value.highlightFragment(index);
      }
    };

    const discoverFragment = async (index) => {
      try {
        const fragment = fragments.value[index];
        await profileService.discoverFragment(currentProfileId.value, fragment.id, true);
        
        fragments.value[index].discovered = 1;
        
        if (sceneManager.value) {
          sceneManager.value.discoverFragment(index);
        }
        
        selectedFragmentIndex.value = index;
        selectedFragmentData.value = fragments.value[index];
        
        updateReconstructionProgress();
        
        showWarning(`发现了 ${fragment.name}！`);
        
      } catch (e) {
        console.error('发现化石失败:', e);
      }
    };

    const useCurrentTool = async () => {
      if (selectedFragmentIndex.value === null) return;
      
      try {
        const fragment = fragments.value[selectedFragmentIndex.value];
        
        if (!fragment.discovered) {
          showWarning('请先发现化石碎片');
          return;
        }
        
        const res = await profileService.useTool(
          currentProfileId.value,
          currentTool.value,
          toolIntensity.value,
          fragment.id
        );
        
        if (sceneManager.value) {
          await sceneManager.value.useTool(
            currentTool.value,
            toolIntensity.value,
            selectedFragmentIndex.value
          );
        }
        
        fragments.value[selectedFragmentIndex.value] = {
          ...fragments.value[selectedFragmentIndex.value],
          ...res.data.affectedFragment
        };
        selectedFragmentData.value = fragments.value[selectedFragmentIndex.value];
        
        if (res.data.warning) {
          showWarning(res.data.warning, 8000);
        }
        
        const toolName = tools.value.find(t => t.type === currentTool.value)?.name;
        showWarning(`使用 ${toolName} 对 ${fragment.name} 进行处理`);
        
      } catch (e) {
        console.error('使用工具失败:', e);
      }
    };

    const excavateNextLayer = async () => {
      if (isExcavating.value) return;
      if (excavatedLayers.value >= layers.value.length) {
        showWarning('所有地层已完成发掘');
        return;
      }
      
      isExcavating.value = true;
      
      try {
        const layerIndex = excavatedLayers.value;
        const layer = layers.value[layerIndex];
        
        if (sceneManager.value) {
          await sceneManager.value.excavateLayer(layerIndex, (progress) => {
          });
        }
        
        for (let i = 0; i < fragments.value.length; i++) {
          const frag = fragments.value[i];
          if (!frag.discovered) {
            const fragY = frag.position_y;
            const layerTop = 6 - layerIndex * 2;
            const layerBottom = layerTop - 2;
            
            if (fragY <= layerTop && fragY >= layerBottom - 1) {
              setTimeout(() => {
                discoverFragment(i);
              }, Math.random() * 1000);
            }
          }
        }
        
        excavatedLayers.value++;
        showWarning(`已剥离 ${layer.name} 层`);
        
        if (excavatedLayers.value > 2) {
          const bias = (excavatedLayers.value - 2) * 0.05;
          tectonicBias.value = Math.min(0.3, bias);
          if (bias > 0.1) {
            showWarning('检测到地层倾斜，碎片坐标可能存在系统性偏差');
          }
        }
        
      } catch (e) {
        console.error('发掘失败:', e);
      }
      
      isExcavating.value = false;
    };

    const matchFragments = async () => {
      try {
        const res = await profileService.matchFragments(currentProfileId.value);
        const data = res.data;
        
        if (data.matches.length >= 2) {
          const match = data.matches[0];
          const idx1 = fragments.value.findIndex(f => f.id === match.fragment1);
          const idx2 = fragments.value.findIndex(f => f.id === match.fragment2);
          
          if (idx1 >= 0 && idx2 >= 0 && sceneManager.value) {
            await sceneManager.value.playSnapAnimation(idx1, idx2);
          }
          
          showWarning(`最佳匹配: ${match.bone1} ↔ ${match.bone2} (置信度: ${(match.confidence * 100).toFixed(0)}%)`);
        } else {
          showWarning('需要发现更多化石碎片才能进行匹配');
        }
        
        updateReconstructionProgress();
        
      } catch (e) {
        console.error('匹配失败:', e);
      }
    };

    const validateBiomechanics = async () => {
      try {
        const res = await profileService.validateBiomechanics(currentProfileId.value);
        const data = res.data;
        
        if (data.valid) {
          showWarning('生物力学校验通过: 所有关节配置符合约束');
        } else {
          const issues = data.issues.slice(0, 3).join('\n');
          showWarning(`生物力学校验发现问题: ${data.issues.length} 个问题`, 10000);
        }
        
      } catch (e) {
        console.error('校验失败:', e);
      }
    };

    const startWalkAnimation = () => {
      if (reconstructionProgress.value < 70) {
        showWarning('需要完成至少70%的发掘才能播放行走动画');
        return;
      }
      
      if (sceneManager.value) {
        if (walkAnimation.value) {
          walkAnimation.value.stop();
          walkAnimation.value = null;
          showWarning('已停止行走动画');
        } else {
          walkAnimation.value = sceneManager.value.createWalkAnimation();
          showWarning('播放复原生物行走姿态动画');
        }
      }
    };

    const applyWeathering = async () => {
      try {
        const res = await profileService.applyWeathering(currentProfileId.value, 30);
        const data = res.data;
        
        for (const result of data.results) {
          const idx = fragments.value.findIndex(f => f.id === result.id);
          if (idx >= 0) {
            fragments.value[idx].weathering_level = result.weathering_level;
          }
        }
        
        if (selectedFragmentData.value) {
          const idx = fragments.value.findIndex(f => f.id === selectedFragmentData.value.id);
          if (idx >= 0) {
            selectedFragmentData.value = fragments.value[idx];
          }
        }
        
        if (data.warning) {
          showWarning(data.warning, 10000);
        } else {
          showWarning('模拟30天风化过程完成');
        }
        
      } catch (e) {
        console.error('风化模拟失败:', e);
      }
    };

    const runAnalysis = async () => {
      try {
        const [fragRes, tectonicRes] = await Promise.all([
          profileService.analyzeFragmentation(currentProfileId.value),
          profileService.analyzeTectonic(currentProfileId.value, 5 + excavatedLayers.value)
        ]);
        
        const fragAnalysis = fragRes.data.fragmentationAnalysis;
        const tectonic = tectonicRes.data.tectonicBias;
        
        fragmentationPattern.value = fragAnalysis.fragmentationPattern;
        tectonicBias.value = Math.max(
          tectonic.averageBias.x,
          tectonic.averageBias.y,
          tectonic.averageBias.z
        );
        
        const layerError = excavatedLayers.value > 3 
          ? { error: excavatedLayers.value > 5 ? 2 : 1, severity: excavatedLayers.value > 5 ? '中等' : '轻微' }
          : { error: 0, severity: '无' };
        
        analysisContent.value = `
          <strong>碎片分析报告</strong><br><br>
          
          <strong>1. 破碎模式:</strong><br>
          ${fragAnalysis.fragmentationPattern}<br><br>
          
          <strong>2. 骨骼类型统计:</strong><br>
          ${Object.entries(fragAnalysis.boneTypes).map(([k, v]) => 
            `${getBoneTypeName(k)}: ${v}个`
          ).join(' | ')}<br><br>
          
          <strong>3. 化石质量评估:</strong><br>
          整体质量: ${(fragAnalysis.quality.overall * 100).toFixed(1)}%<br>
          平均损伤: ${(fragAnalysis.quality.erosion * 100).toFixed(1)}%<br>
          平均风化: ${(fragAnalysis.quality.weathering * 100).toFixed(1)}%<br><br>
          
          <strong>4. 构造偏差分析:</strong><br>
          地层倾斜: ${tectonic.tiltAngle}°<br>
          平均坐标偏差: X=${(tectonic.averageBias.x * 100).toFixed(1)}cm, 
                        Y=${(tectonic.averageBias.y * 100).toFixed(1)}cm, 
                        Z=${(tectonic.averageBias.z * 100).toFixed(1)}cm<br>
          ${tectonic.message}<br><br>
          
          <strong>5. 层位划分:</strong><br>
          当前误差程度: ${layerError.severity}<br>
          ${layerError.error > 0 ? '⚠️ 不同沉积速率可能导致年代层位划分误差' : '层位划分正常'}<br><br>
          
          <strong>建议:</strong><br>
          ${fragAnalysis.quality.overall > 0.7 
            ? '化石保存状况良好，适合进行详细的骨骼学研究。'
            : fragAnalysis.quality.overall > 0.4
            ? '化石有一定程度的损伤，但仍可进行复原工作，建议谨慎处理。'
            : '化石损伤严重，可能影响复原结果的准确性，建议降低工具强度。'
          }
        `;
        
        showAnalysisModal.value = true;
        
      } catch (e) {
        console.error('分析失败:', e);
      }
    };

    const updateReconstructionProgress = () => {
      const total = fragments.value.length;
      const discovered = fragments.value.filter(f => f.discovered).length;
      reconstructionProgress.value = Math.round(discovered / Math.max(1, total) * 100);
    };

    onMounted(async () => {
      await loadScenes();
    });

    onUnmounted(() => {
      if (walkAnimation.value) {
        walkAnimation.value.stop();
      }
      if (sceneManager.value) {
        sceneManager.value.dispose();
      }
    });

    return {
      canvasContainer,
      showWelcome,
      scenes,
      currentScene,
      tools,
      currentTool,
      toolIntensity,
      fragments,
      layers,
      selectedFragmentIndex,
      selectedFragmentData,
      excavatedLayers,
      isExcavating,
      warningMessage,
      warningActive,
      reconstructionProgress,
      fragmentationPattern,
      tectonicBias,
      showAnalysisModal,
      analysisContent,
      loadingStatus,
      errorMessage,
      totalFragments,
      discoveredCount,
      totalLayers,
      excavationProgress,
      currentLayerInfo,
      getBoneTypeName,
      getStatusColor,
      loadScene,
      selectTool,
      selectFragment,
      useCurrentTool,
      excavateNextLayer,
      matchFragments,
      validateBiomechanics,
      startWalkAnimation,
      applyWeathering,
      runAnalysis
    };
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

body {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.app-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #0a0f1a 0%, #16213e 50%, #1a1a2e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.welcome-title {
  font-size: 48px;
  color: #5dade2;
  margin-bottom: 10px;
  text-shadow: 0 0 30px rgba(93, 173, 226, 0.5);
  letter-spacing: 5px;
}

.welcome-subtitle {
  font-size: 18px;
  color: #95a5a6;
  margin-bottom: 30px;
  letter-spacing: 3px;
}

.loading-status {
  color: #f39c12;
  font-size: 14px;
  margin-bottom: 20px;
}

.error-text {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 20px;
  background: rgba(231, 76, 60, 0.1);
  padding: 10px 20px;
  border-radius: 5px;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.welcome-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 600px;
  margin-top: 20px;
}

.welcome-preset-btn {
  padding: 25px 30px;
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.1), rgba(46, 204, 113, 0.1));
  border: 2px solid rgba(93, 173, 226, 0.3);
  border-radius: 15px;
  color: #ecf0f1;
  cursor: pointer;
  transition: all 0.4s ease;
  text-align: left;
}

.welcome-preset-btn:hover {
  transform: translateY(-5px);
  border-color: rgba(93, 173, 226, 0.8);
  box-shadow: 0 10px 40px rgba(93, 173, 226, 0.3);
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.2), rgba(46, 204, 113, 0.2));
}

.welcome-preset-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #5dade2;
}

.welcome-preset-desc {
  font-size: 12px;
  color: #95a5a6;
  line-height: 1.6;
}

.no-scenes {
  margin-top: 20px;
  text-align: center;
  color: #95a5a6;
}

.sidebar {
  width: 300px;
  background: rgba(20, 30, 50, 0.95);
  border-right: 1px solid rgba(100, 150, 200, 0.3);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section {
  padding: 15px;
  border-bottom: 1px solid rgba(100, 150, 200, 0.2);
}

.sidebar-title {
  color: #5dade2;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.preset-btn {
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.2), rgba(30, 130, 76, 0.2));
  border: 1px solid rgba(93, 173, 226, 0.4);
  border-radius: 8px;
  color: #ecf0f1;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.preset-btn:hover {
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.4), rgba(30, 130, 76, 0.4));
  border-color: rgba(93, 173, 226, 0.8);
  transform: translateX(5px);
}

.preset-btn.active {
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.6), rgba(30, 130, 76, 0.6));
  border-color: #5dade2;
  box-shadow: 0 0 15px rgba(93, 173, 226, 0.5);
}

.tool-btn {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: rgba(50, 70, 90, 0.5);
  border: 1px solid rgba(100, 150, 200, 0.3);
  border-radius: 6px;
  color: #bdc3c7;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn:hover {
  background: rgba(93, 173, 226, 0.2);
  border-color: rgba(93, 173, 226, 0.5);
}

.tool-btn.active {
  background: rgba(93, 173, 226, 0.3);
  border-color: #5dade2;
  color: #fff;
}

.tool-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.intensity-slider {
  width: 100%;
  margin-top: 10px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  color: #95a5a6;
  font-size: 11px;
  margin-bottom: 5px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(50, 70, 90, 0.8);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #5dade2;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(93, 173, 226, 0.8);
}

.fragment-item {
  padding: 8px 10px;
  margin-bottom: 5px;
  background: rgba(40, 60, 80, 0.5);
  border-radius: 4px;
  border-left: 3px solid #7f8c8d;
  cursor: pointer;
  transition: all 0.2s;
}

.fragment-item:hover {
  background: rgba(60, 80, 100, 0.6);
}

.fragment-item.discovered {
  border-left-color: #27ae60;
  background: rgba(46, 204, 113, 0.1);
}

.fragment-item.selected {
  border-left-color: #3498db;
  background: rgba(52, 152, 219, 0.2);
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
}

.fragment-item.damaged {
  border-left-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.fragment-name {
  color: #ecf0f1;
  font-size: 13px;
  font-weight: 500;
}

.fragment-status {
  color: #95a5a6;
  font-size: 11px;
  margin-top: 3px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  height: 50px;
  background: rgba(20, 30, 50, 0.95);
  border-bottom: 1px solid rgba(100, 150, 200, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.app-title {
  color: #5dade2;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
}

.status-bar {
  display: flex;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #bdc3c7;
  font-size: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.green {
  background: #2ecc71;
  box-shadow: 0 0 6px rgba(46, 204, 113, 0.6);
}

.status-indicator.yellow {
  background: #f39c12;
  box-shadow: 0 0 6px rgba(243, 156, 18, 0.6);
}

.status-indicator.red {
  background: #e74c3c;
  box-shadow: 0 0 6px rgba(231, 76, 60, 0.6);
}

.scene-container {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  position: relative;
  background: #0a0f1a;
}

.canvas-container canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.warning-banner {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(243, 156, 18, 0.95);
  color: #2c3e50;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.right-panel {
  width: 280px;
  background: rgba(20, 30, 50, 0.9);
  border-left: 1px solid rgba(100, 150, 200, 0.2);
  overflow-y: auto;
  padding: 10px;
}

.info-panel {
  background: rgba(30, 40, 60, 0.8);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid rgba(100, 150, 200, 0.15);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.info-label {
  color: #7f8c8d;
  font-size: 12px;
}

.info-value {
  color: #ecf0f1;
  font-size: 12px;
  font-weight: 500;
}

.info-value.success {
  color: #2ecc71;
}

.info-value.warning {
  color: #f39c12;
}

.info-value.danger {
  color: #e74c3c;
}

.progress-bar {
  height: 6px;
  background: rgba(50, 70, 90, 0.5);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.green {
  background: linear-gradient(90deg, #27ae60, #2ecc71);
}

.progress-fill.yellow {
  background: linear-gradient(90deg, #f39c12, #f1c40f);
}

.progress-fill.red {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}

.action-btn {
  width: 100%;
  padding: 10px 15px;
  margin-top: 8px;
  background: linear-gradient(135deg, #5dade2, #3498db);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.action-btn:disabled {
  background: rgba(100, 100, 100, 0.3);
  cursor: not-allowed;
  color: #7f8c8d;
}

.action-btn.secondary {
  background: linear-gradient(135deg, rgba(100, 150, 200, 0.3), rgba(100, 150, 200, 0.2));
  border: 1px solid rgba(100, 150, 200, 0.4);
  color: #bdc3c7;
}

.action-btn.secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(100, 150, 200, 0.5), rgba(100, 150, 200, 0.3));
}

.action-btn.success {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
}

.action-btn.success:hover:not(:disabled) {
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
}

.instructions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 30, 50, 0.9);
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(100, 150, 200, 0.2);
  color: #95a5a6;
  font-size: 12px;
  z-index: 50;
}

.instructions kbd {
  background: rgba(93, 173, 226, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 3px;
  color: #ecf0f1;
  font-family: monospace;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 12px;
  padding: 25px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(93, 173, 226, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-title {
  color: #5dade2;
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: 2px;
}

.modal-content {
  color: #bdc3c7;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 20px;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>
