const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  // 获取所有路口
  router.get('/', (req, res) => {
    db.all('SELECT * FROM intersections ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  // 获取单个路口
  router.get('/:id', (req, res) => {
    db.get('SELECT * FROM intersections WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: '路口不存在' });
        return;
      }
      res.json(row);
    });
  });

  // 创建路口
  router.post('/', (req, res) => {
    const { x, y, name, type } = req.body;
    const id = uuidv4();
    
    db.run(
      'INSERT INTO intersections (id, x, y, name, type) VALUES (?, ?, ?, ?, ?)',
      [id, x, y, name || '路口', type || 'normal'],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ id, x, y, name: name || '路口', type: type || 'normal' });
      }
    );
  });

  // 更新路口
  router.put('/:id', (req, res) => {
    const { x, y, name, type } = req.body;
    
    db.run(
      'UPDATE intersections SET x = ?, y = ?, name = ?, type = ? WHERE id = ?',
      [x, y, name, type, req.params.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: '路口不存在' });
          return;
        }
        res.json({ id: req.params.id, x, y, name, type });
      }
    );
  });

  // 删除路口
  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM intersections WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: '路口不存在' });
        return;
      }
      res.json({ message: '路口已删除' });
    });
  });

  return router;
};
