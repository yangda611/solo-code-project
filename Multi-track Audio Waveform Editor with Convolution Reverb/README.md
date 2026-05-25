# 多轨音频波形编辑器

基于 Angular + Express + better-sqlite3 开发的专业音频编辑工具。

## ✨ 功能特性

### 核心功能
- 📁 **音频导入** - 支持 WAV/MP3 文件导入
- ✂️ **波形编辑** - 剪切、复制、粘贴音频片段
- 🎚️ **轨道控制** - 音量调节、声相定位
- 🔊 **卷积混响** - 基于FFT的高质量混响处理
- 📊 **频谱分析** - STFT实时频谱热力图
- 🎛️ **四种预设** - 快速加载示例音频

### 视觉效果
- 🎨 **波形缩放动画** - 平滑过渡的缩放效果
- 🔥 **频谱热力图** - 随播放头移动实时更新
- 🔵 **圆形进度条** - 卷积计算进度可视化
- 🚨 **削波警示** - 红色柱状动画预警
- 🌊 **撤销动画** - 波纹回滚效果

### 实验特性展示
- ⚠️ **过零点咔嗒声** - 片段边界未对齐时产生
- 📉 **延迟与溢出** - 长脉冲响应的性能问题
- 👁️ **频谱泄露伪影** - FFT窗函数导致的模糊
- 💾 **内存膨胀问题** - 撤销栈过深的副作用

## 📁 项目结构

```
Multi-track Audio Waveform Editor with Convolution Reverb/
├── backend/
│   ├── package.json          # 后端依赖配置
│   ├── server.js             # Express API服务器
│   ├── database.js           # SQLite数据库操作
│   └── audioProcessor.js     # 音频处理核心算法
│
└── frontend/
    ├── package.json          # 前端依赖配置
    ├── angular.json          # Angular配置
    ├── tsconfig.json         # TypeScript配置
    ├── proxy.conf.json       # API代理配置
    └── src/
        ├── app/
        │   ├── app.module.ts
        │   ├── app.component.ts
        │   ├── audio.service.ts
        │   └── waveform-editor/waveform-editor.component.ts
        ├── styles.css
        ├── index.html
        └── main.ts
```

## 🚀 快速开始

### 1. 安装后端依赖
```bash
cd backend
npm install
```

### 2. 启动后端服务器
```bash
npm start
# 服务器运行在 http://localhost:3000
```

### 3. 安装前端依赖
```bash
cd ../frontend
npm install
```

### 4. 启动前端开发服务器
```bash
npm start
# 前端运行在 http://localhost:4200
```

## 📡 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/audio/import` | 导入音频文件 |
| GET | `/api/audio/preset/:id` | 加载预设音频 |
| POST | `/api/audio/spectrogram` | 计算频谱图 |
| POST | `/api/audio/convolve` | 执行卷积混响 |
| POST | `/api/audio/generate-ir` | 生成脉冲响应 |
| GET | `/api/history/:trackId` | 获取编辑历史 |
| POST | `/api/history` | 保存历史记录 |
| GET | `/api/presets` | 获取混响预设 |
| POST | `/api/presets` | 添加混响预设 |

## 🎵 音频预设说明

| 预设 | 说明 | 特性 |
|------|------|------|
| **预设一** | 正弦波+白噪音混合 | 测试频率响应、噪声门 |
| **预设二** | 包含瞬态脉冲的鼓点 | 测试攻击释放、瞬态处理 |
| **预设三** | 极端短脉冲金属声 | 测试高频处理、失真效果 |
| **预设四** | 100段微小片段拼接 | 测试颗粒合成、拼接咔嗒声 |

## 🛠️ 核心技术栈

### 后端
- **Node.js + Express** - Web服务器框架
- **better-sqlite3** - 高性能SQLite数据库
- **wavefile** - WAV文件解析处理
- **fft.js** - 快速傅里叶变换

### 前端
- **Angular 17** - 现代化前端框架
- **RxJS** - 响应式数据流
- **Web Audio API** - 浏览器音频播放
- **Canvas 2D** - 波形与频谱绘制

## 📊 数据库结构

### track_history (编辑历史)
```sql
CREATE TABLE track_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id TEXT NOT NULL,
  action TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### impulse_response_presets (混响预设)
```sql
CREATE TABLE impulse_response_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  samples TEXT NOT NULL,
  sample_rate INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 算法说明

### FFT卷积混响
```javascript
// 使用 Overlap-Add 方法
1. 音频和IR补零到2的幂次长度
2. 分别执行 FFT 变换
3. 频域复数乘法
4. IFFT 逆变换回时域
5. 重叠相加处理边界
```

### STFT频谱图
```javascript
// 短时傅里叶变换
1. 汉宁窗函数处理
2. 256样本步长滑动
3. 1024点FFT计算
4. 幅度谱对数压缩
5. HSL颜色映射渲染
```

## ⚠️ 已知限制

1. **最大音频长度** - 推荐小于5分钟
2. **内存占用** - 长音频处理内存消耗较大
3. **浏览器兼容** - 需要现代浏览器支持 Web Audio API
4. **撤销深度** - 最多保存50步历史记录

## 🤝 开发说明

本项目专为音频处理教学和算法演示开发，重点展示：
- 数字信号处理基础概念
- 音频编辑的常见问题
- 可视化效果实现方法
- 全栈应用架构设计

---

**注意**: 这是一个教学演示项目，如需生产环境使用请进行充分的性能优化和测试。