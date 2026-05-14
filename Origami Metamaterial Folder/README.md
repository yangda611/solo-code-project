# 刚性折纸结构运动学与双稳态分析系统

基于 React + Three.js + Node.js + SQLite 开发的刚性折纸分析系统。

## 功能特性

### 核心功能
- ✅ 3D虚拟纸面折痕图案可视化
- ✅ 山折（红色）/谷折（青色）属性分配
- ✅ 面板厚度可调节设置
- ✅ 基于球面连杆机构的运动学分析
- ✅ 刚性折叠可动性检测
- ✅ 双稳态势能landscape计算
- ✅ SQLite本地数据存储

### 预设场景
- 📐 **Miura-ori 预设** - 经典三浦折叠模式
- 💧 **Waterbomb 水弹预设** - 水弹基础图案
- ✨ **Randlett Flasher 预设** - 闪光折叠结构
- 📦 **厚板兼容性预设** - 厚板折叠测试场景

### 动画系统
- 🔄 **折叠动画** - 面板绕折痕旋转动画
- 🌊 **变形演示** - 二面角参数空间轨迹动画
- ⚡ **双稳态跳变** - 势能曲面等高线滑动动画
- 🔒 **自锁演示** - 自锁状态切换弹跳动画

### 物理现象模拟
- 🟥 **厚度干涉区域** - 红色高亮脉冲动画
- 🔧 **过约束变形** - 局部面板弹性变形效果
- 📏 **厚度累积** - 几何不相容检测
- 🔒 **死锁构型** - 折叠序列错误检测
- ⚡ **意外跳变** - 双稳态势垒过低跳变

## 技术栈

### 前端
- React 18
- Three.js / React Three Fiber
- React Three Drei
- Axios

### 后端
- Node.js + Express
- SQLite (better-sqlite3)
- Math.js (数学计算)

## 项目结构

```
Origami Metamaterial Folder/
├── package.json                 # 根项目配置
├── README.md                    # 项目文档
│
├── backend/                     # 后端目录
│   ├── package.json
│   ├── server.js                # 服务器主入口
│   ├── database.js              # SQLite数据库配置
│   ├── kinematics.js            # 运动学求解
│   ├── energyAnalysis.js        # 能量/双稳态分析
│   └── presets.js               # 预设场景数据
│
└── frontend/                    # 前端目录
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.js               # 主应用组件
        └── components/
            └── OrigamiScene.js  # 3D场景组件
```

## 安装与运行

### 方法一：分别启动（推荐用于开发）

#### 1. 启动后端服务
```bash
cd backend
npm install
npm run dev
```
后端服务将在 http://localhost:3001 启动

#### 2. 启动前端服务
```bash
cd frontend
npm install
npm start
```
前端应用将在 http://localhost:3000 启动

### 方法二：使用根目录脚本

```bash
# 安装所有依赖
npm run install-all

# 同时启动前后端
npm run dev
```

## API 接口说明

### 预设场景
- `GET /api/presets` - 获取所有预设列表
- `GET /api/presets/:name` - 获取指定预设场景

### 运动学分析
- `POST /api/analyze/kinematics` - 运动学分析
  - 请求参数：vertices, edges, faces, thickness
  - 返回：可折叠性、自由度、干涉检测等

### 能量分析
- `POST /api/analyze/energy` - 势能landscape计算
  - 请求参数：vertices, edges, faces, thickness, resolution
  - 返回：势能曲面、势阱、势垒、双稳态判断

### 折叠分析
- `POST /api/analyze/folding` - 实时折叠状态分析
  - 请求参数：vertices, edges, faces, thickness, progress
  - 返回：当前二面角、势能、干涉、死锁等

### 数据存储
- `POST /api/crease-patterns` - 保存折痕图案
- `GET /api/crease-patterns` - 获取所有保存的图案
- `POST /api/dihedral-sequences` - 保存二面角序列
- `POST /api/energy-landscapes` - 保存势能landscape

## 使用说明

1. **选择预设**：点击左侧预设按钮加载不同的折纸图案
2. **调整折叠**：拖动"折叠进度"滑块观察3D折叠动画
3. **设置厚度**：调整"面板厚度"观察厚度干涉效果
4. **播放动画**：点击动画控制按钮播放不同类型的动画
5. **观察状态**：右侧信息面板实时显示当前势能、干涉情况等
6. **查看分析**：状态分析面板显示运动学和双稳态分析结果

## 核心算法说明

### 球面连杆机构理论
- 基于球面运动学求解折叠自由度
- 使用图论方法分析约束条件
- 计算顶点-边-面拓扑关系

### 势能计算
- 弯曲势能：基于二面角偏离平衡位置的平方
- 应变势能：基于面板面积变化
- 接触势能：基于面板间距的惩罚函数

### 双稳态分析
- 势能landscape网格采样
- 局部极小值（势阱）检测
- 势垒高度计算与跳变判断

## 开发计划

- [ ] 自定义折痕绘制功能
- [ ] 更多预设场景
- [ ] 导出STL/OBJ模型
- [ ] 参数优化功能
- [ ] 多稳态扩展分析

## 许可证

MIT License
