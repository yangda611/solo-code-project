# 状态机建模与推断系统

基于隐马尔可夫模型 (HMM) 的可视化建模与推断系统。

## 功能特性

### 1. 稳态分布分析
- 计算马尔可夫链的稳态概率分布
- **吸收态检测与可视化
- 归一化错误检测
- 迭代收敛过程动画展示
- 状态转移流动粒子动画

### 2. Viterbi 最优路径解码
- 动态描边动画展示最优状态序列
- Delta 矩阵热力图可视化
- 数值下溢检测与警告
- 路径概率实时动画效果

### 3. 后验概率热力图
- γ(t, i) 后验概率可视化
- 前向-α 与 后向-β 概率对比
- 状态概率演变折线图动画
- 对数似然值监控

### 4. Baum-Welch 参数学习
- 似然收敛曲线逐帧绘制
- 转移矩阵学习前后对比
- 发射矩阵学习前后对比
- 零概率转移检测
- 过拟合震荡检测与警告

### 5. 四个预设案例
- **吸收态坍塌**：展示吸收态如何导致概率收敛到零
- **维特比溢出**：长序列导致数值下溢问题
- **零概率失败**：参数估计失败案例
- **狄利克雷先验偏差**：非遍历链学习偏差

## 项目结构

```
Markov Chain & HMM Sandbox/
├── backend/
│   ├── server.js          # Express 服务器
│   ├── hmm.js             # HMM 算法实现
│   └── package.json       # 后端依赖
├── frontend/
│   ├── index.html         # HTML 入口
│   ├── vite.config.js     # Vite 配置
│   ├── package.json        # 前端依赖
│   └── src/
│       ├── main.js         # Vue 入口
│       ├── App.vue         # 主组件
│       ├── router.js       # 路由配置
│       ├── store.js        # 状态管理
│       ├── style.css       # 全局样式
│       └── views/        # 页面组件
│           ├── Home.vue
│           ├── ModelEditor.vue
│           ├── SteadyState.vue
│           ├── ViterbiPath.vue
│           ├── PosteriorProb.vue
│           └── BaumWelch.vue
└── README.md
```

## 快速开始

### 安装后端服务

```bash
cd backend
npm install
npm start
```

后端将运行在 http://localhost:3000

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将运行在 http://localhost:5173

## API 接口

- `GET /api/health` - 健康检查
- `POST /api/steady-state` - 计算稳态分布
- `POST /api/viterbi` - Viterbi 解码
- `POST /api/posterior` - 计算后验概率
- `POST /api/baum-welch` - Baum-Welch 参数学习

## 核心算法

### Forward 前向算法
计算观测序列的似然度

### Backward 后向算法
反向概率计算

### Viterbi 算法
寻找最可能隐藏状态序列

### Baum-Welch 算法
EM 算法进行参数学习

## 技术栈

**前端**
- Vue 3
- Vue Router
- Chart.js
- Vite

**后端**
- Node.js
- Express
- CORS

## 动画效果

- 状态转移粒子流动
- 维特比路径动态描边
- 热力图颜色渐变
- 似然收敛曲线逐帧绘制
- 数值下溢警告闪烁
- 归一化错误抖动效果

## 许可证

MIT
