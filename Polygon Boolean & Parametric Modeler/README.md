# 二维多边形布尔运算器

基于 **Solid.js + Koa + SQLite3 开发的二维多边形布尔运算器，实现了 Greiner-Hormann 裁剪算法和边界奇异性修复。

## ✨ 功能特性

### 核心算法
- **Greiner-Hormann 裁剪算法实现
- 共线边界检测与处理
- 自交多边形检测
- 边界奇异性修复
- 数值容差处理

### 运算类型
- ✅ 并集 (Union)
- ✅ 交集 (Intersection)
- ✅ 差集 (Difference)

### 动画效果
- 🔵 **边界交点闪烁动画** - 高亮显示交点位置
- 🌊 **内部区域波浪扩展填充动画
- 🔴 **错误边界红色抖动修正动画**
- 🎨 **结果多边形渐变描边动画**
- ✨ **自交点旋转标记动画**

### 预设场景
1. **共线边界的退化多边形合并
2. **自交多边形的非简单区域解析
3. **多点切触的奇异接触判定
4. **孔洞多边形差集运算的相反方向错误

## 📁 项目结构

```
Polygon Boolean & Parametric Modeler/
├── backend/                 # 后端服务
│   ├── server.js         # Koa 服务器
│   ├── greiner-hormann.js  # 布尔运算算法
│   ├── database.js     # SQLite 数据库
│   └── package.json
└── frontend/            # 前端应用
    ├── src/
    │   ├── App.jsx          # 主应用组件
    │   ├── Canvas.jsx         # 画布组件（含动画）
    │   ├── ControlPanel.jsx   # 控制面板
    │   ├── PresetSelector.jsx # 预设选择器
    │   ├── HistoryPanel.jsx   # 历史记录面板
    │   └── index.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动服务

#### 1. 启动后端服务 (端口 3001)
```bash
cd backend
npm start
# 或开发模式 (nodemon)
npm run dev
```

#### 2. 启动前端服务 (端口 3000)
```bash
cd frontend
npm run dev
```

### 访问应用
打开浏览器访问: `http://localhost:3000`

## 📖 使用说明

### 基本操作
1. **选择多边形类型**: 点击"主体"或"裁剪"按钮
2. **绘制多边形**: 在画布上点击添加顶点
3. **完成绘制**: 双击画布或点击"完成"按钮
4. **选择运算**: 选择并集/交集/差集
5. **执行运算**: 点击"执行运算"按钮
6. **查看结果**: 观察动画效果和运算结果

### 预设场景
点击预设场景按钮可快速加载演示用例：
- **预设一**: 共线边界处理演示
- **预设二**: 自交多边形处理演示  
- **预设三**: 多点切触边界演示
- **预设四**: 孔洞方向错误演示

## 🔧 API 接口

### 布尔运算
```
POST /api/boolean
Content-Type: application/json

{
  "subject": [{x, y}, ...],
  "clip": [{x, y}, ...],
  "operation": "union|intersection|difference"
}
```

### 多边形管理
```
GET    /api/polygons          # 获取所有多边形
POST   /api/polygons          # 保存多边形
GET    /api/polygons/:id      # 获取单个多边形
DELETE /api/polygons/:id      # 删除多边形
```

### 历史记录
```
GET /api/history               # 获取运算历史
GET /api/presets                # 获取预设场景
```

## 💾 数据库结构

### polygons 表
- id: 主键
- name: 多边形名称
- points: JSON 格式的顶点
- is_hole: 是否为孔洞
- color: 显示颜色
- created_at: 创建时间

### operations 表
- id: 主键
- operation_type: 运算类型
- subject_id: 主体多边形 ID
- clip_id: 裁剪多边形 ID
- result_points: 结果多边形
- status: 状态
- created_at: 创建时间

### intersection_points 表
- id: 主键
- operation_id: 运算 ID
- x, y: 交点坐标
- type: 交点类型

## 🎯 算法说明

### Greiner-Hormann 算法
1. 找到两个多边形的所有交点
2. 在交点处拆分边界
3. 根据进出标记确定遍历方向
4. 交叉追踪形成结果多边形

### 边界奇异性处理
- 共线边检测与合并
- 自交点检测与标记
- 退化多边形过滤
- 数值容差处理

## 🔍 可视化效果

### 可观察到的现象
- 数值容差导致的微小缝隙或重叠
- 共线边的重复合并过程
- 孔洞方向错误导致的内外反转
- 退化三角形引起的面积计算失效
- 自交点的旋转标记
- 边界交点的闪烁高亮

## 📝 注意事项

1. 每个多边形至少需要 3 个顶点
2. 建议按顺时针或逆时针顺序绘制顶点
3. 自交多边形会自动检测并标记
4. 运算历史会自动保存到 SQLite 数据库

## 🤝 技术栈

- **前端**: Solid.js + Vite + Canvas
- **后端**: Koa.js
- **数据库**: SQLite3
- **算法**: Greiner-Hormann

## 📄 License

MIT
