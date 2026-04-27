const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  // 获取最新仿真统计
  router.get('/stats', (req, res) => {
    db.get(`
      SELECT * FROM simulation_stats 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row || {
        total_vehicles: 0,
        congestion_index: 0,
        avg_travel_time: 0,
        accident_risk: 0,
        avg_speed: 0
      });
    });
  });

  // 获取历史统计数据
  router.get('/history', (req, res) => {
    const limit = req.query.limit || 50;
    db.all(`
      SELECT * FROM simulation_stats 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  // 记录新的统计数据
  router.post('/stats', (req, res) => {
    const { 
      total_vehicles, 
      congestion_index, 
      avg_travel_time, 
      accident_risk, 
      avg_speed 
    } = req.body;
    
    const id = uuidv4();
    
    db.run(
      `INSERT INTO simulation_stats 
       (id, total_vehicles, congestion_index, avg_travel_time, accident_risk, avg_speed) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id, 
        total_vehicles || 0, 
        congestion_index || 0, 
        avg_travel_time || 0, 
        accident_risk || 0, 
        avg_speed || 0
      ],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({
          id,
          total_vehicles: total_vehicles || 0,
          congestion_index: congestion_index || 0,
          avg_travel_time: avg_travel_time || 0,
          accident_risk: accident_risk || 0,
          avg_speed: avg_speed || 0
        });
      }
    );
  });

  // 清理旧的统计数据
  router.delete('/history', (req, res) => {
    const keep = req.query.keep || 100;
    db.run(`
      DELETE FROM simulation_stats 
      WHERE id NOT IN (
        SELECT id FROM simulation_stats 
        ORDER BY timestamp DESC 
        LIMIT ?
      )
    `, [keep], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: `已清理旧数据，保留最近 ${keep} 条记录` });
    });
  });

  return router;
};
