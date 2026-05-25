# 连分数计算器 - Continued Fraction Calculator

一个基于 **Qwik + Fastify + SQLite3** 的精确有理数四则运算与连分数展开系统，演示了数值计算中的典型问题场景。

## ✨ 功能特性

### 核心算法
- **欧几里得算法**：计算最大公约数，支持任意精度整数
- **连分数展开**：将分数转换为连分数表示 [a₀; a₁, a₂, ..., aₙ]
- **收敛项计算**：计算各阶收敛分数，展示收敛过程
- **二次无理数周期检测**：检测平方根连分数的周期性

### 四则运算
- 分数加法 ➕
- 分数减法 ➖
- 分数乘法 ✖️
- 分数除法 ➗

### 动画效果
- **飞入动画**：连分数项依次飞入显示
- **收敛轨迹动画**：SVG 路径绘制动画，展示逼近真值过程
- **大整数宽度动画**：超大整数动态宽度变化
- **错误抖动动画**：输入错误时的抖动和阴影效果
- **周期脉冲动画**：周期性连分数的高亮闪烁效果

### 四个预设问题场景
1. **❌ 分母为零异常**：演示除零错误处理和抖动动画
2. **📈 超大整数增长**：观察大整数运算的性能下降
3. **⚠️ 截断收敛误差**：展示不同截断位置的精度差异
4. **🔀 负数表示歧义**：演示符号处理的一致性问题

## 🏗️ 项目结构

```
Arbitrary-Precision Rational Calculator/
├── backend/                    # Fastify 后端服务
│   ├── src/
│   │   ├── algorithms/        # 核心算法实现
│   │   │   └── continuedFraction.ts
│   │   ├── database.ts        # SQLite 数据库封装
│   │   └── server.ts          # Fastify 服务器入口
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Qwik 前端应用
│   ├── src/
│   │   ├── components/        # UI 组件
│   │   │   ├── ContinuedFractionDisplay.tsx
│   │   │   ├── ConvergenceChart.tsx
│   │   │   ├── FractionInput.tsx
│   │   │   ├── HistoryList.tsx
│   │   │   └── PresetScenarios.tsx
│   │   ├── routes/            # 页面路由
│   │   │   └── index.tsx
│   │   ├── services/          # API 服务
│   │   │   └── api.ts
│   │   ├── global.css         # 全局样式和动画
│   │   ├── types.ts           # TypeScript 类型定义
│   │   └── root.tsx           # 应用根组件
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── data/                       # SQLite 数据库目录 (运行时生成)
├── package.json                # 根项目配置
└── README.md                   # 项目说明文档
```

## 🚀 快速开始

### 前置要求
- Node.js >= 18.0.0
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

或者使用根目录脚本：
```bash
# 安装所有依赖（根目录）
npm run install:all
```

### 启动开发服务器

#### 1. 启动后端服务
```bash
cd backend
npm run dev
```
后端将在 `http://localhost:3001` 启动

#### 2. 启动前端服务
```bash
cd frontend
npm run dev
```
前端将在 `http://localhost:5173` 启动

### 构建生产版本
```bash
# 构建后端
cd backend
npm run build

# 构建前端
cd ../frontend
npm run build
```

## 📡 API 接口

### 计算连分数
```
POST /api/calculate
Content-Type: application/json

{
  "numerator": "355",
  "denominator": "113",
  "maxTerms": 100
}
```

### 分数四则运算
```
POST /api/operate
Content-Type: application/json

{
  "fraction1": { "numerator": "1", "denominator": "2" },
  "fraction2": { "numerator": "1", "denominator": "3" },
  "operation": "add"  // add | subtract | multiply | divide
}
```

### 二次无理数连分数
```
POST /api/quadratic-surd
Content-Type: application/json

{
  "n": 2,      // 计算 √n 的连分数
  "maxTerms": 200
}
```

### 欧几里得算法步骤
```
POST /api/euclidean
Content-Type: application/json

{
  "a": "1071",
  "b": "462"
}
```

### 历史记录
```
GET    /api/history          # 获取计算历史
DELETE /api/history          # 清空历史记录
```

### 公式存储
```
GET    /api/formulas         # 获取保存的公式
POST   /api/formulas         # 保存公式
DELETE /api/formulas         # 清空公式
```

## 📊 数据库结构

### formulas 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| expression | TEXT | 表达式字符串 |
| numerator | TEXT | 分子（大整数） |
| denominator | TEXT | 分母（大整数） |
| continued_fraction | TEXT | 连分数表示 |
| created_at | DATETIME | 创建时间 |

### history 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| type | TEXT | calculation / operation |
| input | TEXT | 输入内容 |
| result | TEXT | 结果内容 |
| created_at | DATETIME | 创建时间 |

## 🎨 动画系统设计

### 飞入动画 (fly-in)
```css
@keyframes flyIn {
  0% { opacity: 0; transform: translateY(-50px) scale(0.5) rotate(-10deg); }
  50% { transform: translateY(10px) scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
}
```

### 轨迹绘制 (tracePath)
```css
@keyframes tracePath {
  0% { stroke-dashoffset: 1000; }
  100% { stroke-dashoffset: 0; }
}
```

### 周期脉冲 (periodHighlight)
```css
@keyframes periodHighlight {
  0%, 100% { background-color: rgba(236, 72, 153, 0.2); }
  50% { background-color: rgba(236, 72, 153, 0.5); }
}
```

### 错误抖动 (shake)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
  50% { box-shadow: 0 0 20px 10px rgba(239, 68, 68, 0.5); }
}
```

## 🔬 典型问题场景演示

### 场景 1：分母为零异常
- **问题**：数学上，分母为零是未定义的
- **演示**：输入分母为 0，观察错误捕获和抖动动画
- **技术点**：异常处理、前端错误状态管理

### 场景 2：超大整数性能问题
- **问题**：大整数运算导致内存和 CPU 占用指数增长
- **演示**：输入 18 位以上整数，观察计算时间和宽度动画
- **技术点**：任意精度算术、性能监控

### 场景 3：截断收敛误差
- **问题**：连分数截断位置不同导致收敛值偏差
- **演示**：观察 SVG 轨迹，对比不同项数的近似精度
- **技术点**：数值分析、误差传播、可视化

### 场景 4：负数表示歧义
- **问题**：负数连分数有多种表示约定
- **演示**：输入负分数，观察算法的符号处理
- **技术点**：符号规范化、欧几里得算法边界条件

## 🛠️ 技术栈

### 后端
- **Fastify**: 高性能 Node.js Web 框架
- **Better-SQLite3**: 原生 SQLite 驱动
- **BigInteger.js**: 任意精度整数库
- **TypeScript**: 类型安全

### 前端
- **Qwik**: 可恢复性 Web 框架
- **Vite**: 下一代构建工具
- **SVG**: 原生矢量图形动画
- **CSS Animations**: 纯 CSS 动画系统

## 📝 开发说明

### 核心算法位置
- 连分数算法：`backend/src/algorithms/continuedFraction.ts`
- 数据库封装：`backend/src/database.ts`
- API 路由：`backend/src/server.ts`

### 前端组件
- 连分数展示：`frontend/src/components/ContinuedFractionDisplay.tsx`
- 收敛图表：`frontend/src/components/ConvergenceChart.tsx`
- 预设场景：`frontend/src/components/PresetScenarios.tsx`

### 样式与动画
- 全局样式：`frontend/src/global.css`
- 动画关键帧：文件顶部 `@keyframes` 定义

## 📄 License

MIT
