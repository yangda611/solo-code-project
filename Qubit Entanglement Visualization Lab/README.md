# 量子纠缠态演化与测量模拟实验室

基于 **Svelte + Three.js + Rust Axum + SQLite** 技术栈开发的量子计算纠缠态演化与测量模拟系统。

## 功能特性

### 核心功能
- **3D 布洛赫球可视化**：实时显示量子比特状态矢量
- **希尔伯特空间视图**：3D 概率分布柱状图
- **密度矩阵演化**：后端基于密度矩阵形式求解薛定谔方程
- **冯诺依曼熵计算**：实时追踪熵的演化轨迹
- **测量概率分布**：实时计算各本征态的测量概率

### 预设算法（4个）
1. **贝尔态制备预设** - 制备两量子比特的最大纠缠贝尔态
2. **量子隐形传态预设** - 使用量子纠缠传输未知量子态
3. **Grover 搜索算法预设** - 量子搜索算法实现二次加速
4. **表面码纠错预设** - 拓扑量子纠错码

### 物理噪声模型
- **环境热噪声退相干** - 可观测到退相干时间急剧缩短
- **单量子比特门校准误差** - 旋转角度存在系统性偏差
- **相邻量子比特串扰耦合** - 相邻比特间的相互干扰
- **测量基选择误差** - 态投影偏差

### 动画效果
- 布洛赫球态矢量旋转动画
- 多比特间纠缠连线脉动动画
- 量子态坍缩时的波纹扩散动画
- 概率幅条形图实时跳动动画
- 退相干过程的振幅衰减动画

## 技术栈

### 后端（Rust）
- **Axum** - 异步 Web 框架
- **SQLite (sqlx)** - 本地数据库
- **num-complex** - 复数运算
- **rand** - 随机数生成
- **tracing** - 日志系统

### 前端（Svelte）
- **SvelteKit** - 前端框架
- **Three.js** - 3D 可视化
- **TypeScript** - 类型安全

## 项目结构

```
Qubit Entanglement Visualization Lab/
├── backend/                    # Rust Axum 后端
│   ├── src/
│   │   ├── main.rs           # 主程序入口和 API 路由
│   │   ├── lib.rs            # 模块导出
│   │   ├── quantum.rs        # 量子计算核心逻辑
│   │   ├── database.rs       # SQLite 数据库操作
│   │   ├── models.rs         # 数据模型定义
│   │   ├── presets.rs        # 预设算法
│   │   └── noise.rs          # 噪声模型
│   ├── Cargo.toml
│   └── quantum.db            # SQLite 数据库文件（运行时生成）
└── frontend/                  # Svelte 前端
    ├── src/
    │   ├── routes/
    │   │   ├── +page.svelte    # 主页面
    │   │   └── +layout.svelte  # 布局组件
    │   ├── lib/
    │   │   ├── BlochSphere.svelte      # 布洛赫球 3D 组件
    │   │   ├── HilbertSpace.svelte     # 希尔伯特空间组件
    │   │   ├── ControlPanel.svelte     # 控制面板
    │   │   ├── ProbabilityBars.svelte  # 概率条形图
    │   │   ├── EntropyChart.svelte     # 熵演化图表
    │   │   └── types.ts                # TypeScript 类型定义
    │   ├── app.html
    │   └── app.css
    ├── package.json
    ├── svelte.config.js
    ├── vite.config.ts
    └── tsconfig.json
```

## 安装与运行

### 前置要求
- Rust 工具链 (1.70+)
- Node.js (18+)
- npm 或 pnpm

### 启动后端
```bash
cd backend
cargo run
```
后端服务将在 `http://localhost:3001` 启动

### 启动前端
```bash
cd frontend
npm install
npm run dev
```
前端开发服务器将在 `http://localhost:5173` 启动

### 完整运行流程
1. 启动后端服务
2. 启动前端服务
3. 在浏览器中打开 `http://localhost:5173`
4. 点击顶部预设按钮加载算法场景
5. 调整左侧噪声参数
6. 点击"运行模拟"按钮
7. 观察四个可视化区域的实时变化

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /presets | 获取预设列表 |
| GET | /presets/:id | 加载指定预设 |
| POST | /simulate | 运行量子模拟 |
| GET | /circuits | 获取保存的电路列表 |
| POST | /circuits | 保存量子电路 |
| GET | /circuits/:id | 获取指定电路 |

## 数据库结构

### quantum_circuits 表
存储量子电路拓扑结构和门操作序列

### decoherence_records 表
存储退相干时间序列数据

## 可视化说明

### 布洛赫球视图
- 蓝色球体：量子比特节点
- 橙色箭头：量子态矢量
- 紫色连线：量子纠缠
- 绿色波纹：量子坍缩动画

### 希尔伯特空间视图
- 3D 柱状图：各量子态的概率幅
- 柱体高度：概率平方根
- 颜色渐变：概率从低到高

### 噪声参数调节
- **退相干速率**：控制环境热噪声强度
- **校准误差**：门操作的系统误差
- **串扰耦合**：相邻比特的相互干扰
- **测量基偏差**：测量操作的投影误差
- **环境温度**：模拟热噪声背景

## 物理原理

### 密度矩阵演化
使用薛定谔方程的密度矩阵形式：
```
dρ/dt = -i/ħ [H, ρ]
```

### 冯诺依曼熵
```
S(ρ) = -Tr(ρ log₂ ρ)
```

### 测量概率
对于基矢 |ψ⟩，测量概率为：
```
P = ⟨ψ|ρ|ψ⟩
```

## 许可证

MIT License
