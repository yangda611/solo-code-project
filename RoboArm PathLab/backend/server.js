const express = require('express');
const cors = require('cors');
const path = require('path');
const { calculateInverseKinematics, checkCollision, planPath } = require('./algorithms');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.post('/api/ik', (req, res) => {
  try {
    const { armConfig, targetPoint } = req.body;
    const result = calculateInverseKinematics(armConfig, targetPoint);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/collision', (req, res) => {
  try {
    const { armConfig, jointAngles, obstacles } = req.body;
    const result = checkCollision(armConfig, jointAngles, obstacles);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/path', (req, res) => {
  try {
    const { armConfig, startAngles, targetPoint, obstacles } = req.body;
    const result = planPath(armConfig, startAngles, targetPoint, obstacles);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`RoboArm PathLab 后端服务运行在端口 ${PORT}`);
});
