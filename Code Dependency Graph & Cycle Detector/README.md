# 模块依赖分析器

基于 **Angular + Express + sql.js** (SQLite WebAssembly) 开发的模块依赖分析器，使用 **Tarjan 算法** 检测强连通分量并进行可视化分析。

## ✅ 修复说明

### 已修复的问题
1. **better-sqlite3 编译错误**：改用纯 JavaScript 实现的 `sql.js`（SQLite WebAssembly 版本），无需原生编译
2. **路径特殊字符问题**：项目路径中的 `&` 符号导致 Windows 命令行解析错误，通过 PowerShell 正确处理路径
3. **空值检查缺失**：为所有服务方法添加了空值检查和错误处理
4. **数据库 API 异步化**：适配 sql.js 的 Promise API，重写所有数据库操作
5. **伪代码解析增强**：支持注释、JSON 格式、特殊字符的模块名
6. **循环检测深度限制**：添加最大深度限制防止栈溢出
7. **动态导入去重**：避免重复报告相同的条件循环问题
8. **组件样式隔离**：修复组件 styleUrls 路径错误

---

## 🚀 快速开始

### 方式一：使用启动脚本（推荐）

**启动后端：**
```bash
双击运行 start-backend.bat
```

**启动前端：**
```bash
双击运行 start-frontend.bat
```

### 方式二：手动启动

#### 后端启动
```bash
cd backend
npm install
node server.js
```
后端运行在: http://localhost:3000

#### 前端启动（需要 Angular CLI）
```bash
cd frontend
npm install
ng serve
```
前端运行在: http://localhost:4200

---

## 🔧 功能特性

### 核心算法
- **Tarjan 算法**：强连通分量（SCC）检测，时间复杂度 O(V+E)
- **拓扑排序**：基于 DFS 的依赖关系排序
- **循环检测**：识别循环依赖和自环依赖，支持动态导入条件循环
- **影响范围计算**：BFS 算法分析破环操作的影响范围
- **破环推荐**：智能推荐最优破环边，按影响评分排序

### 可视化动画
| 动画效果 | 触发方式 | 说明 |
|---------|---------|------|
| 💓 节点脉冲扩散 | 点击"节点脉冲"按钮 | 所有节点呼吸灯效果 |
| 🔴 循环路径追踪 | 点击循环条目 | 红色虚线追踪循环路径 |
| 💠 SCC 聚合并膨胀 | 点击强连通分量条目 | 分量收缩后膨胀动画 |
| 🌊 依赖层级瀑布 | 点击"瀑布动画"按钮 | 按拓扑排序顺序显示 |
| ✨ 破碎粒子飞散 | 点击"执行断开"按钮 | 循环解除时粒子效果 |

### 四个预设测试用例

#### 预设一：多重间接循环隐藏的深层依赖
- **场景**：4 个独立的强连通分量，递归深度达 5 层
- **可观察问题**：递归检测性能卡顿、深层循环定位困难

#### 预设二：自环依赖导致的死锁启动顺序
- **场景**：包含自环依赖 + 大型服务循环链
- **可观察问题**：自环依赖死锁风险、启动顺序计算错误

#### 预设三：不同强连通分量间的虚假边干扰
- **场景**：4 个 SCC 之间存在跨分量反向边
- **可观察问题**：强连通分量识别遗漏、跨分量反向边未被标记

#### 预设四：动态导入引发的条件循环检测失效
- **场景**：动态导入模块在特定条件下形成循环
- **可观察问题**：动态导入缺失导致的假阳性循环、条件循环检测失效

---

## 📁 项目结构

```
Code Dependency Graph & Cycle Detector/
├── backend/                    # Express 后端
│   ├── package.json
│   ├── server.js              # API 服务（含错误处理）
│   ├── algorithms.js          # 核心算法（Tarjan、拓扑排序等）
│   ├── database.js            # sql.js 数据库封装（异步）
│   ├── presets.js             # 四个预设测试用例
│   ├── test-api.js            # API 自动化测试脚本
│   └── .npmrc                 # npm 配置（解决路径问题）
├── frontend/                   # Angular 前端
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── app.component.ts       # 主组件
│       │   ├── app.component.html     # 模板
│       │   ├── app.component.css      # 组件样式
│       │   ├── app.module.ts          # 模块定义
│       │   └── services/
│       │       ├── api.service.ts             # API 服务
│       │       └── graph-visualization.service.ts  # D3.js 可视化
│       ├── styles.css             # 全局样式 + 动画关键帧
│       ├── main.ts
│       └── index.html
├── start-backend.bat          # 后端一键启动脚本
├── start-frontend.bat         # 前端一键启动脚本
├── .gitignore                 # Git 忽略配置
└── README.md
```

---

## 📄 主要文件说明

### 后端核心文件

#### [algorithms.js](file:///d:/localCode/solo-code-project/Code%20Dependency%20Graph%20&%20Cycle%20Detector/backend/algorithms.js#L1-L330)
- `tarjan(graph)` - Tarjan 算法检测强连通分量
- `topologicalSort(graph)` - 拓扑排序
- `getCyclePaths(graph)` - 获取所有循环路径
- `findCycleInComponent(graph, component)` - 在 SCC 中找具体循环
- `recommendBreakingEdges(graph)` - 智能推荐破环边
- `parsePseudocode(code)` - 解析伪代码为图结构
- `detectDynamicImportIssues(graph, dynamicNodes)` - 检测动态导入条件循环

#### [server.js](file:///d:/localCode/solo-code-project/Code%20Dependency%20Graph%20&%20Cycle%20Detector/backend/server.js#L1-L244)
- 完整的 REST API 接口
- 全局错误处理中间件
- 请求日志记录
- 优雅关闭处理（SIGTERM/SIGINT）
- CORS 配置

#### [database.js](file:///d:/localCode/solo-code-project/Code%20Dependency%20Graph%20&%20Cycle%20Detector/backend/database.js#L1-L215)
- sql.js 异步封装
- 自动持久化到文件
- 快照存储和查询
- 重构建议存储

### 前端核心文件

#### [app.component.ts](file:///d:/localCode/solo-code-project/Code%20Dependency%20Graph%20&%20Cycle%20Detector/frontend/src/app/app.component.ts#L1-L402)
- 完整的业务逻辑
- 离线 fallback 算法（后端不可用时也能工作）
- 动画控制逻辑

#### [graph-visualization.service.ts](file:///d:/localCode/solo-code-project/Code%20Dependency%20Graph%20&%20Cycle%20Detector/frontend/src/app/services/graph-visualization.service.ts#L1-L280)
- D3.js 力导向图布局
- 5 种动画效果实现
- 节点拖拽支持
- 空值安全检查

---

## 🌐 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/presets` | 获取预设列表 |
| GET | `/api/presets/:id` | 获取预设详情 |
| POST | `/api/analyze` | 分析依赖图 |
| POST | `/api/parse-pseudocode` | 解析伪代码 |
| POST | `/api/snapshots` | 保存快照 |
| GET | `/api/snapshots` | 获取快照列表 |
| GET | `/api/snapshots/:id` | 获取快照详情 |
| POST | `/api/snapshots/:id/suggestions` | 保存重构建议 |
| GET | `/api/snapshots/:id/suggestions` | 获取重构建议 |
| POST | `/api/influence-range` | 计算影响范围 |

### 请求示例

```bash
# 分析依赖图
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "A": ["B", "C"],
      "B": ["D"],
      "D": ["B"]
    },
    "dynamicNodes": []
  }'
```

---

## ✅ 测试验证

### 运行 API 测试
```bash
cd backend
node test-api.js
```

预期输出：
```
========================================
  后端 API 测试
========================================

[1/6] 测试健康检查...
  ✓ 状态码: 200

[2/6] 测试获取预设列表...
  ✓ 状态码: 200
  ✓ 预设数量: 4

[3/6] 测试伪代码解析...
  ✓ 状态码: 200
  ✓ 节点数量: 5

[4/6] 测试图分析（带循环）...
  ✓ 状态码: 200
  ✓ 强连通分量数: 5
  ✓ 循环数: 2
  ✓ 推荐方案数: 6

[5/6] 测试保存快照...
  ✓ 状态码: 200

[6/6] 测试获取快照列表...
  ✓ 状态码: 200

========================================
  ✅ 所有测试通过！
========================================
```

---

## 🎯 伪代码格式说明

### 基础格式
```
// 单行依赖
ModuleA -> ModuleB

// 多个目标
ModuleA -> [ModuleB, ModuleC, ModuleD]

// 多行定义
ModuleA -> ModuleB
ModuleA -> ModuleC
ModuleB -> ModuleD

// 自环依赖（会被检测）
ServiceA -> ServiceA

// 支持注释
# 这是注释
// 这也是注释
```

### JSON 格式
```json
{
  "ModuleA": ["ModuleB", "ModuleC"],
  "ModuleB": ["ModuleD"],
  "ModuleD": []
}
```

---

## 🔍 可观察的问题场景

### 1. 强连通分量识别遗漏
- **现象**：部分循环节点未被正确分组到同一 SCC
- **触发**：加载预设三，观察 SCC 列表
- **原因**：跨分量反向边干扰 Tarjan 算法的 lowLink 值计算

### 2. 跨分量反向边未被标记
- **现象**：连接两个 SCC 的边未被特殊标记
- **触发**：加载预设三，观察图中不同颜色分量间的边
- **原因**：当前版本仅高亮循环边，跨分量反向边需要额外处理

### 3. 动态导入导致的假阳性循环
- **现象**：某些执行路径下才存在的循环被误报
- **触发**：加载预设四，在动态导入框输入 `DynamicModule, PluginA`
- **原因**：静态分析无法区分条件导入路径

### 4. 大型图递归检测性能卡顿
- **现象**：分析大型图时 UI 卡顿
- **触发**：加载预设一，观察分析耗时
- **原因**：Tarjan 算法的递归深度过大，或 D3 力导向图计算量大

---

## 📝 技术栈

### 后端
- **Node.js** + **Express 4** - Web 服务器
- **sql.js** - SQLite WebAssembly 版本（纯 JS，无需编译）
- **CORS** - 跨域支持
- **body-parser** - 请求体解析

### 前端
- **Angular 17** - 前端框架
- **D3.js 7** - 数据可视化
- **TypeScript** - 类型安全
- **RxJS** - 响应式编程

### 算法
- **Tarjan 算法** - 强连通分量检测
- **DFS/BFS** - 拓扑排序、影响范围计算
- **力导向布局** - 图可视化

---

## 🎨 界面预览

```
┌─────────────────────────────────────────────────────────────────┐
│  模块依赖分析器 - Module Dependency Analyzer                    │
├──────────────┬───────────────────────────────┬──────────────────┤
│  📥 输入     │         📊 可视化             │  ⚠️ 检测结果     │
│              │                              │                  │
│  预设用例    │   [节点脉冲] [瀑布] [重置]   │  问题警报        │
│  • 预设一    │                              │  • 自环依赖警告   │
│  • 预设二    │    ┌───┐    ┌───┐            │                  │
│  • 预设三    │    │ A │───▶│ B │            │  强连通分量      │
│  • 预设四    │    └───┘    └───┘            │  • B↔D↔F↔G↔H     │
│              │      ◎        │              │                  │
│  伪代码输入  │      ▼        ▼              │  检测到的循环    │
│  A -> B      │    ┌───┐    ┌───┐            │  • B→D→F→G→H→B  │
│  A -> C      │    │ E │    │ C │            │                  │
│  ...         │    └───┘    └───┘            │  破环建议        │
│              │                              │  • 断开 B→D      │
│  [解析]      │  拓扑顺序: A C E F G H B D  │  • 断开 D→F      │
│  [保存快照]  │                              │                  │
│              │                              │                  │
└──────────────┴───────────────────────────────┴──────────────────┘
```

---

## 🐛 已知问题 & 解决方案

| 问题 | 解决方案 |
|------|---------|
| better-sqlite3 编译失败 | 改用 sql.js（WebAssembly） |
| 路径含 `&` 导致命令错误 | 使用 PowerShell 处理路径 + .npmrc 配置 |
| Windows 中文乱码 | 启动脚本添加 `chcp 65001` |
| 大型图性能问题 | 添加递归深度限制、考虑迭代版 Tarjan |
| 动态导入条件循环 | 显式指定 dynamicNodes 参数 |

---

## 📄 License

MIT License
