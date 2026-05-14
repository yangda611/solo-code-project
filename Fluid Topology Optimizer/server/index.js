const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const topologyRoutes = require('./routes/topology');
const presetRoutes = require('./routes/presets');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../client/build')));

app.use('/api/topology', topologyRoutes);
app.use('/api/presets', presetRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

db.initDatabase().then(() => {
  console.log('数据库初始化成功');
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT} (数据库未连接)`);
  });
});

module.exports = app;
