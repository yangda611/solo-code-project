const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  // 获取所有车辆生成点
  router.get('/', (req, res) => {
    db.all(`
      SELECT sp.*
      FROM spawn_points sp
      ORDER BY sp.created_at DESC
    `, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  // 获取单个车辆生成点
  router.get('/:id', (req, res) => {
    db.get(`
      SELECT sp.*
      FROM spawn_points sp
      WHERE sp.id = ?
    `, [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: '车辆生成点不存在' });
        return;
      }
      res.json(row);
    });
  });

  // 创建车辆生成点
  router.post('/', (req, res) => {
    const { 
      road_id, 
      position, 
      direction, 
      spawn_rate, 
      min_speed, 
      max_speed 
    } = req.body;
    
    const id = uuidv4();
    
    db.run(
      `INSERT INTO spawn_points 
       (id, road_id, position, direction, spawn_rate, min_speed, max_speed) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        road_id, 
        position || 0, 
        direction || 'forward', 
        spawn_rate || 5, 
        min_speed || 40, 
        max_speed || 60
      ],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({
          id,
          road_id,
          position: position || 0,
          direction: direction || 'forward',
          spawn_rate: spawn_rate || 5,
          min_speed: min_speed || 40,
          max_speed: max_speed || 60
        });
      }
    );
  });

  // 更新车辆生成点
  router.put('/:id', (req, res) => {
    const { 
      position, 
      direction, 
      spawn_rate, 
      min_speed, 
      max_speed 
    } = req.body;
    
    db.run(
      `UPDATE spawn_points 
       SET position = ?, direction = ?, spawn_rate = ?, min_speed = ?, max_speed = ?
       WHERE id = ?`,
      [position, direction, spawn_rate, min_speed, max_speed, req.params.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: '车辆生成点不存在' });
          return;
        }
        res.json({ 
          id: req.params.id, 
          position, 
          direction, 
          spawn_rate, 
          min_speed, 
          max_speed 
        });
      }
    );
  });

  // 删除车辆生成点
  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM spawn_points WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: '车辆生成点不存在' });
        return;
      }
      res.json({ message: '车辆生成点已删除' });
    });
  });

  return router;
};
