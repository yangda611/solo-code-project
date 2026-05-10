# 虚拟古生物化石发掘与骨骼复原系统

## 项目简介

这是一个基于 Vue 3 + Babylon.js + Fastify + SQLite 的虚拟古生物化石发掘与骨骼复原系统。用户可以在3D沉积地层模型中使用专业工具逐层剥离围岩，发现并复原古生物骨骼化石。

## 技术栈

- **前端**: Vue 3 + Vite + Babylon.js 6
- **后端**: Fastify 4 + SQLite (better-sqlite3) + math.js
- **通信**: RESTful API

## 系统功能

### 核心功能

1. **3D地层探索** - 交互式3D沉积地层模型
2. **工具系统** - 气动笔、毛刷、化学试剂三种发掘工具
3. **逐层发掘** - 按照地层年代顺序剥离围岩
4. **化石标记** - 记录化石碎片的空间坐标和朝向
5. **骨骼匹配** - 基于碎裂模式的骨骼碎片智能匹配
6. **关节估计** - 自动估计关节角度和连接方式
7. **生物力学校验** - 验证骨骼组合的生物学合理性
8. **完整复原** - 生成复原骨架并播放行走动画

### 动画效果

- ✅ 围岩剥离粒子飞散动画
- ✅ 化石碎片高亮脉冲动画
- ✅ 骨骼拼接对齐吸附动画
- ✅ 地层剖面滑动揭露动画
- ✅ 复原生物行走姿态循环动画

### 物理模拟

- ✅ **化石剥蚀** - 过度使用气动工具导致化石表面损伤
- ✅ **地层倾斜** - 构造运动造成碎片空间坐标系统性偏差
- ✅ **层位误差** - 不同沉积速率下年代层位划分错误
- ✅ **风化酥解** - 脆弱化石暴露于空气中后的加速风化

### 预设场景

1. **三叠纪海洋沉积** - 鱼龙等海生爬行动物化石
2. **侏罗纪河流三角洲** - 蜥脚类恐龙化石
3. **白垩纪火山灰掩埋** - 兽脚类恐龙化石（如霸王龙类）
4. **冰川期冻土层** - 猛犸象等更新世哺乳动物化石

## 项目结构

```
.
├── backend/
│   ├── package.json
│   ├── server.js           # Fastify 服务器
│   ├── database.js         # SQLite 数据库管理
│   ├── algorithms.js       # 核心算法模块
│   └── fossil_system.db    # SQLite 数据库（运行后生成）
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue         # 主应用组件
        ├── style.css       # 全局样式
        └── services/
            ├── api.js      # API 服务
            └── sceneManager.js  # Babylon.js 场景管理
```

## 安装与运行

### 后端设置

```bash
cd backend
npm install
npm start
```

后端将在 http://localhost:3001 启动

### 前端设置

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:3000 启动

### 使用步骤

1. 启动后端服务
2. 启动前端开发服务器
3. 在浏览器中访问 http://localhost:3000
4. 选择一个预设场景开始发掘
5. 使用工具逐层剥离围岩，发现化石碎片
6. 执行碎片匹配和生物力学校验
7. 完成复原后播放行走动画

## 工具说明

### 气动笔 (Air Chisel)
- **用途**: 快速剥离坚硬围岩
- **特点**: 效率高，但可能损伤化石
- **风险**: 过度使用会导致化石表面剥蚀

### 毛刷 (Brush)
- **用途**: 精细清理化石表面
- **特点**: 对化石损伤小，但效率较低
- **风险**: 几乎不会损伤化石

### 化学试剂 (Chemical)
- **用途**: 溶解碳酸盐岩等特殊围岩
- **特点**: 中等效率，中等损伤
- **风险**: 化学腐蚀可能导致化石酥解

## API 接口

### 场景管理
- `GET /api/scenes` - 获取所有预设场景
- `GET /api/scenes/:name` - 获取场景详情
- `POST /api/scenes/:name/load` - 加载场景

### 发掘操作
- `POST /api/profiles/:id/fragments/discover` - 标记化石发现
- `POST /api/profiles/:id/tool/use` - 使用发掘工具
- `POST /api/profiles/:id/weathering` - 模拟风化过程

### 骨骼复原
- `POST /api/profiles/:id/match` - 执行碎片匹配
- `POST /api/profiles/:id/match/pair` - 配对两个碎片
- `POST /api/profiles/:id/biomechanics/validate` - 生物力学校验
- `POST /api/profiles/:id/reconstruct` - 完整骨架重建

### 分析报告
- `POST /api/profiles/:id/analysis/stratigraphy` - 地层分析
- `POST /api/profiles/:id/analysis/tectonic` - 构造偏差分析
- `POST /api/profiles/:id/analysis/fragmentation` - 破碎模式分析

## 核心算法

### 骨骼匹配算法
基于四个维度综合评估：
- 骨骼类型兼容性 (30%)
- 空间距离邻近性 (30%)
- 朝向角度一致性 (20%)
- 相对方位合理性 (20%)

### 关节角度估计
通过向量分析计算：
- 俯仰角 (Pitch)
- 偏航角 (Yaw)
- 翻滚角 (Roll)

### 生物力学约束
- **铰链关节**: 限制在单一轴转动
- **球窝关节**: 允许三维空间转动
- **固定关节**: 几乎不允许相对运动

## 数据库设计

### stratigraphic_profiles (地层剖面)
- 保存场景的层位信息和地质年代

### fossil_fragments (化石碎片)
- 位置坐标、旋转角度、损伤程度、风化状态
- 地层倾斜导致的坐标误差

### skeleton_topology (骨骼拓扑)
- 骨骼间的父子关系、关节类型、关节角度
- 匹配置信度和生物力学有效性

### excavation_logs (发掘日志)
- 记录每一步操作的详细信息

## 注意事项

1. **工具使用策略**: 建议先用气动笔快速剥离，接近化石时改用毛刷
2. **风化模拟**: 已发现的化石暴露时间越长，风化程度越高
3. **地层倾斜**: 随着发掘深度增加，坐标偏差会逐渐显现
4. **层位判断**: 不同沉积速率可能导致年代学解释误差
5. **完成度要求**: 需要发现70%以上的化石才能播放行走动画

## 许可证

MIT License
