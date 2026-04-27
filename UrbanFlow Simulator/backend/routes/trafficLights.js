const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  // 获取所有红绿灯
  router.get('/', (req, res) => {
    db.all(`
      SELECT tl.*, i.x as intersection_x, i.y as intersection_y, i.name as intersection_name
      FROM traffic_lights tl
      JOIN intersections i ON tl.intersection_id = i.id
      ORDER BY tl.created_at DESC
    `, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  // 获取单个红绿灯
  router.get('/:id', (req, res) => {
    db.get(`
      SELECT tl.*, i.x as intersection_x, i.y as intersection_y, i.name as intersection_name
      FROM traffic_lights tl
      JOIN intersections i ON tl.intersection_id = i.id
      WHERE tl.id = ?
    `, [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: '红绿灯不存在' });
        return;
      }
      res.json(row);
    });
  });

  // 创建红绿灯
  router.post('/', (req, res) => {
    const { 
      intersection_id, 
      road_id, 
      phase, 
      green_duration, 
      yellow_duration, 
      red_duration, 
      current_color 
    } = req.body;
    
    const id = uuidv4();
    
    db.run(
      `INSERT INTO traffic_lights 
       (id, intersection_id, road_id, phase, green_duration, yellow_duration, red_duration, current_color, timer) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        intersection_id, 
        road_id, 
        phase || 0, 
        green_duration || 30, 
        yellow_duration || 3, 
        red_duration || 30, 
        current_color || 'red',
        0
      ],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({
          id,
          intersection_id,
          road_id,
          phase: phase || 0,
          green_duration: green_duration || 30,
          yellow_duration: yellow_duration || 3,
          red_duration: red_duration || 30,
          current_color: current_color || 'red',
          timer: 0
        });
      }
    );
  });

  // 更新红绿灯
  router.put('/:id', (req, res) => {
    const { 
      phase, 
      green_duration, 
      yellow_duration, 
      red_duration, 
      current_color,
      timer 
    } = req.body;
    
    db.run(
      `UPDATE traffic_lights 
       SET phase = ?, green_duration = ?, yellow_duration = ?, red_duration = ?, current_color = ?, timer = ?
       WHERE id = ?`,
      [phase, green_duration, yellow_duration, red_duration, current_color, timer, req.params.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: '红绿灯不存在' });
          return;
        }
        res.json({ 
          id: req.params.id, 
          phase, 
          green_duration, 
          yellow_duration, 
          red_duration, 
          current_color,
          timer 
        });
      }
    );
  });

  // 删除红绿灯
  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM traffic_lights WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: '红绿灯不存在' });
        return;
      }
      res.json({ message: '红绿灯已删除' });
    });
  });

  return router;
};
