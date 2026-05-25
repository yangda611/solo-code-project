# 多轨音频波形编辑器 - 启动指南

## 项目结构

```
Multi-track Audio Waveform Editor with Convolution Reverb/
├── backend/          # Node.js + Express 后端
│   ├── package.json
│   ├── server.js
│   ├── database.js
│   └── audioProcessor.js
│
└── frontend/         # Angular 17 前端
    ├── package.json
    ├── angular.json
    ├── proxy.conf.json
    └── src/
        ├── app/
        ├── styles.css
        └── main.ts
```

## 快速启动

### 第一步：启动后端服务

```bash
cd backend

# 安装依赖
npm install

# 启动服务 (端口 3001)
npm start
```

后端依赖：
- express: Web 框架
- better-sqlite3: SQLite 数据库
- cors: 跨域支持
- multer: 文件上传
- wavefile: WAV 文件处理
- fft.js: 快速傅里叶变换

### 第二步：启动前端服务

```bash
# 新开一个终端
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (端口 4200)
npm start
```

前端依赖：
- @angular/*: Angular 17 框架
- rxjs: 响应式编程
- zone.js: 变更检测

### 第三步：访问应用

打开浏览器访问：http://localhost:4200

## 功能说明

### 音频预设

点击左侧面板的预设按钮加载示例音频：

1. **预设一** - 正弦波与白噪音混合 (5秒)
   - 测试频率响应和噪声门效果
   
2. **预设二** - 包含瞬态脉冲的鼓点 (4秒)
   - 测试攻击释放和瞬态处理效果
   - 包含底鼓、军鼓和踩镲
   
3. **预设三** - 极端短脉冲产生金属声 (2秒)
   - 测试高频处理和失真效果
   - FM合成算法
   
4. **预设四** - 100段微小片段拼接 (3秒)
   - 测试颗粒合成和拼接咔嗒声
   - 四种波形交替：正弦、方波、噪声、锯齿

### 波形编辑

- **剪切** - 选中片段后剪切
- **复制** - 选中片段后复制
- **粘贴** - 在当前位置粘贴
- **撤销/重做** - 操作历史记录

### 轨道控制

- **音量滑块** - 0% ~ 200%
- **声相调节** - 左 ↔ 中 ↔ 右
- **轨道激活** - 点击轨道切换活动状态

### 卷积混响

从下拉菜单选择混响类型：
- Hall (大厅) - 3秒衰减
- Room (房间) - 1.5秒衰减
- Plate (板式) - 2秒衰减
- Spring (弹簧) - 1.8秒衰减
- Metal (金属) - 快速调制衰减

### 频谱分析

- 实时 STFT 频谱热力图
- 颜色从蓝色(低频)到红色(高频)
- 随播放头移动实时更新

## 技术实现

### 后端音频处理

**FFT 卷积算法**
```javascript
// 1. 时域 → 频域 (FFT)
// 2. 频域复数乘法
// 3. 频域 → 时域 (IFFT)
// 4. 重叠相加处理边界
```

**STFT 频谱图**
```javascript
// 窗函数: Hann 窗
// 窗口大小: 1024 采样点
// 步长: 256 采样点 (75%重叠)
// 512 个频率区间
```

### 前端 Canvas 渲染

**波形绘制**
- 峰值包络线
- 渐变色填充
- 网格时间标记
- 平滑缩放动画

**频谱热力图**
- HSL 颜色映射
- ImageData 像素级渲染
- 播放头位置同步

### 数据库

- **track_history** - 编辑操作历史
- **impulse_response_presets** - 混响预设

## 常见问题

### Q: 点击预设按钮没有反应？
A: 检查后端服务是否正常运行，查看浏览器控制台和后端终端输出。

### Q: 频谱图没有显示？
A: 确保音频已加载，samples 数组不为空，检查 /api/audio/spectrogram 接口响应。

### Q: 混响处理很慢？
A: FFT 卷积是 O(n log n) 复杂度，长音频处理时间较长。可以看到圆形进度条动画。

### Q: 浏览器控制台显示 API 错误？
A: 检查 proxy.conf.json 代理配置和后端端口(3001)是否匹配。

## 开发调试

### 后端调试
```bash
# 查看详细日志
npm start
# 观察 convolution 进度和 spectrogram 错误
```

### 前端调试
- 打开浏览器开发者工具 F12
- 查看 Network 标签页的 API 请求
- 查看 Console 标签页的错误信息

## API 接口测试

使用 curl 或 Postman 测试：

```bash
# 测试健康检查
curl http://localhost:3001/api/health

# 测试预设加载
curl http://localhost:3001/api/audio/preset/1

# 测试频谱图 (需要 POST body)
curl -X POST http://localhost:3001/api/audio/spectrogram \
  -H "Content-Type: application/json" \
  -d '{"samples":[0.1,0.2,...],"sampleRate":44100}'
```

---

**注意**: 如果遇到任何问题，请确保：
1. Node.js 版本 >= 16
2. 所有依赖正确安装
3. 端口 3001 和 4200 未被占用
4. Angular CLI 已全局安装
