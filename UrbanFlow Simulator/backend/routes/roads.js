const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  // 获取所有道路
  router.get('/', (req, res) => {
    db.all(`
      SELECT r.*, 
             s.x as start_x, s.y as start_y, s.name as start_name,
             e.x as end_x, e.y as end_y, e.name as end_name
      FROM roads r
      JOIN intersections s ON r.start_intersection_id = s.id
      JOIN intersections e ON r.end_intersection_id = e.id
      ORDER BY r.created_at DESC
    `, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  // 获取单个道路
  router.get('/:id', (req, res) => {
    db.get(`
      SELECT r.*, 
             s.x as start_x, s.y as start_y, s.name as start_name,
             e.x as end_x, e.y as end_y, e.name as end_name
      FROM roads r
      JOIN intersections s ON r.start_intersection_id = s.id
      JOIN intersections e ON r.end_intersection_id = e.id
      WHERE r.id = ?
    `, [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: '道路不存在' });
        return;
      }
      res.json(row);
    });
  });

  // 创建道路
  router.post('/', (req, res) => {
    const { 
      start_intersection_id, 
      end_intersection_id, 
      name, 
      length, 
      lanes, 
      speed_limit, 
      capacity, 
      direction 
    } = req.body;
    
    const id = uuidv4();
    
    db.run(
      `INSERT INTO roads 
       (id, start_intersection_id, end_intersection_id, name, length, lanes, speed_limit, capacity, direction) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        start_intersection_id, 
        end_intersection_id, 
        name || '道路', 
        length, 
        lanes || 2, 
        speed_limit || 60, 
        capacity || 100, 
        direction || 'two-way'
      ],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({
          id,
          start_intersection_id,
          end_intersection_id,
          name: name || '道路',
          length,
          lanes: lanes || 2,
          speed_limit: speed_limit || 60,
          capacity: capacity || 100,
          direction: direction || 'two-way'
        });
      }
    );
  });

  // 更新道路
  router.put('/:id', (req, res) => {
    const { 
      name, 
      length, 
      lanes, 
      speed_limit, 
      capacity, 
      direction 
    } = req.body;
    
    db.run(
      `UPDATE roads 
       SET name = ?, length = ?, lanes = ?, speed_limit = ?, capacity = ?, direction = ? 
       WHERE id = ?`,
      [name, length, lanes, speed_limit, capacity, direction, req.params.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: '道路不存在' });
          return;
        }
        res.json({ 
          id: req.params.id, 
          name, 
          length, 
          lanes, 
          speed_limit, 
          capacity, 
          direction 
        });
      }
    );
  });

  // 删除道路
  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM roads WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: '道路不存在' });
        return;
      }
      res.json({ message: '道路已删除' });
    });
  });

  return router;
};
