# 声子带隙计算与优化系统

基于 Svelte + Three.js + Next.js + SQLite 的周期性弹性结构声子带隙计算与可视化系统。

## 功能特性

### 核心功能
- ✅ **2D/3D 布拉维晶格可视化** - 支持正方晶格、六角晶格、金刚石结构等多种晶格类型
- ✅ **散射体形状与材料参数调节** - 可调节弹性模量比、密度比、填充率等参数
- ✅ **能带结构实时计算与可视化** - 基于有限元法的本征频率求解
- ✅ **带隙宽度与归一化频率计算** - 自动识别并高亮显示带隙范围

### 可视化动画
- ✅ **布里渊区高对称路径扫描动画** - 3D 可视化 k 点扫描过程
- ✅ **能带曲线实时绘制动画** - Chart.js 动态绘制能带结构
- ✅ **本征模态振型驻波动画** - 可视化不同模态的振动模式
- ✅ **带隙频率范围高亮填充动画** - 动态高亮显示带隙区域
- ✅ **弹性波传播衰减粒子动画** - 模拟弹性波在晶格中的传播

### 物理现象展示
- ✅ **杂散能带交叉** - 在模态密集区域可见
- ✅ **数值奇异性** - 高填充率下散射体接触导致
- ✅ **带边频率偏移** - 有限尺寸效应引起
- ✅ **能带简并解除不完全** - 各向异性材料导致

### 预设场景
- ✅ **二维正方晶格预设**
- ✅ **三维金刚石结构预设**
- ✅ **梯度折射率透镜预设**
- ✅ **拓扑边界态预设**

## 技术栈

### 前端
- **Svelte** - 响应式前端框架
- **Three.js** - 3D 可视化渲染
- **Chart.js** - 能带结构图表绘制
- **Vite** - 构建工具

### 后端
- **Next.js** - API 服务框架
- **SQLite (better-sqlite3)** - 本地数据持久化
- **TypeScript** - 类型安全

## 项目结构

```
Phononic Bandgap Designer/
├── frontend/                 # 前端 Svelte 应用
│   ├── src/
│   │   ├── components/       # 组件目录
│   │   │   ├── Scene3D.svelte          # 3D晶格场景
│   │   │   ├── BandStructureChart.svelte # 能带结构图
│   │   │   ├── BrillouinZone.svelte    # 布里渊区可视化
│   │   │   ├── EigenModeVisualizer.svelte # 本征模态可视化
│   │   │   ├── WavePropagation.svelte  # 波传播动画
│   │   │   ├── ControlPanel.svelte     # 参数控制面板
│   │   │   └── PresetSelector.svelte   # 预设选择器
│   │   ├── utils/
│   │   │   └── bandgapCalculator.ts    # 带隙计算工具
│   │   ├── types.ts                    # 类型定义
│   │   ├── App.svelte                  # 主应用组件
│   │   └── main.ts                     # 入口文件
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── backend/                 # 后端 Next.js 应用
    ├── app/
    │   └── api/
    │       ├── calculate/route.ts      # 计算 API
    │       └── history/route.ts        # 历史记录 API
    ├── lib/
    │   ├── db.ts                       # 数据库初始化
    │   └── calculator.ts               # 带隙计算逻辑
    ├── types.ts                        # 类型定义
    ├── package.json
    └── tsconfig.json
```

## 快速开始

### 前置要求
- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 启动开发服务器

```bash
# 启动后端 (端口 3001)
cd backend
npm run dev

# 启动前端 (端口 5173)
cd ../frontend
npm run dev
```

### 访问应用
- 前端应用: http://localhost:5173
- 后端 API: http://localhost:3001

## 使用说明

### 1. 选择预设场景
点击顶部预设卡片快速加载经典声子晶体结构：
- 二维正方晶格
- 三维金刚石结构
- 梯度折射率透镜
- 拓扑边界态

### 2. 调节参数
在左侧控制面板调节：
- **几何参数**: 晶格类型、散射体形状、填充率、晶格常数
- **材料参数**: 基体/散射体弹性模量、基体/散射体密度

### 3. 计算能带结构
点击"计算能带结构"按钮，系统将：
1. 初始化有限元网格
2. 求解本征频率
3. 构建能带结构
4. 绘制可视化结果

### 4. 切换可视化视图
使用中央顶部标签切换不同可视化模式：
- 📐 **晶格结构**: 3D 晶格与散射体渲染
- 💠 **布里渊区**: k 空间高对称路径扫描
- 🎵 **本征模态**: 振动模态驻波动画
- 🌊 **波传播**: 弹性波衰减粒子模拟

## 数据库结构

### simulations 表
- id: 主键
- created_at: 创建时间
- lattice_type: 晶格类型
- scatterer_shape: 散射体形状
- filling_fraction: 填充率
- lattice_constant: 晶格常数
- matrix_modulus: 基体弹性模量
- scatterer_modulus: 散射体弹性模量
- matrix_density: 基体密度
- scatterer_density: 散射体密度

### band_data 表
- id: 主键
- simulation_id: 关联模拟 ID
- k: k 点坐标
- frequency: 频率
- band_index: 能带索引

### band_gaps 表
- id: 主键
- simulation_id: 关联模拟 ID
- start_frequency: 带隙起始频率
- end_frequency: 带隙结束频率
- normalized_width: 归一化宽度

## 开发说明

### 添加新的晶格类型
1. 在 `frontend/src/types.ts` 中扩展 `GeometryParams`
2. 在 `Scene3D.svelte` 中添加新晶格的渲染逻辑
3. 在 `bandgapCalculator.ts` 中添加对应的能带计算

### 自定义计算算法
修改 `backend/lib/calculator.ts` 中的 `BandgapCalculator` 类来实现更精确的有限元法计算。

### 添加新的可视化
在 `frontend/src/components/` 中创建新组件，然后在 `App.svelte` 中添加对应的标签页。

## 许可证

MIT License
