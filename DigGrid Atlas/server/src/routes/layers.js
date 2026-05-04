const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../database');

const router = new Router();

router.get('/square/:squareId', async (ctx) => {
  const db = getDatabase();
  const { squareId } = ctx.params;
  
  const result = db.exec(
    'SELECT * FROM layers WHERE square_id = ? ORDER BY order_index ASC',
    [squareId]
  );
  
  const layers = result.length > 0 ? result[0].values.map(row => {
    const columns = result[0].columns;
    return columns.reduce((obj, col, idx) => {
      obj[col] = row[idx];
      return obj;
    }, {});
  }) : [];
  
  ctx.body = { success: true, data: layers };
});

router.get('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const result = db.exec('SELECT * FROM layers WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '土层不存在' };
    return;
  }
  
  const columns = result[0].columns;
  const layer = columns.reduce((obj, col, idx) => {
    obj[col] = result[0].values[0][idx];
    return obj;
  }, {});
  
  ctx.body = { success: true, data: layer };
});

router.post('/', async (ctx) => {
  const db = getDatabase();
  const { square_id, name, color, depth_start, depth_end, description, order_index } = ctx.request.body;
  
  if (!square_id || !name) {
    ctx.status = 400;
    ctx.body = { success: false, message: '探方ID和名称不能为空' };
    return;
  }
  
  const squareCheck = db.exec('SELECT id FROM squares WHERE id = ?', [square_id]);
  if (squareCheck.length === 0 || squareCheck[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '探方不存在' };
    return;
  }
  
  const id = uuidv4();
  
  db.run(
    `INSERT INTO layers (id, square_id, name, color, depth_start, depth_end, description, order_index, is_stripped)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, square_id, name, color || '#8B4513', depth_start || 0, depth_end || 0, description || '', order_index || 0]
  );
  saveDatabase();
  
  ctx.body = { success: true, data: { id, square_id, name, color, depth_start, depth_end, description, order_index, is_stripped: 0 } };
});

router.put('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  const { name, color, depth_start, depth_end, description, order_index, is_stripped } = ctx.request.body;
  
  const checkResult = db.exec('SELECT id FROM layers WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '土层不存在' };
    return;
  }
  
  const updates = [];
  const values = [];
  
  if (name) { updates.push('name = ?'); values.push(name); }
  if (color) { updates.push('color = ?'); values.push(color); }
  if (depth_start !== undefined) { updates.push('depth_start = ?'); values.push(depth_start); }
  if (depth_end !== undefined) { updates.push('depth_end = ?'); values.push(depth_end); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (order_index !== undefined) { updates.push('order_index = ?'); values.push(order_index); }
  if (is_stripped !== undefined) { updates.push('is_stripped = ?'); values.push(is_stripped); }
  
  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: '没有更新内容' };
    return;
  }
  
  values.push(id);
  
  db.run(`UPDATE layers SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  
  ctx.body = { success: true, message: '更新成功' };
});

router.put('/:id/strip', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const checkResult = db.exec('SELECT id, is_stripped FROM layers WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '土层不存在' };
    return;
  }
  
  db.run('UPDATE layers SET is_stripped = 1 WHERE id = ?', [id]);
  saveDatabase();
  
  ctx.body = { success: true, message: '土层已剥离' };
});

router.delete('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const checkResult = db.exec('SELECT id FROM layers WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '土层不存在' };
    return;
  }
  
  db.run('DELETE FROM artifacts WHERE layer_id = ?', [id]);
  db.run('DELETE FROM boundaries WHERE layer_id = ?', [id]);
  db.run('DELETE FROM layers WHERE id = ?', [id]);
  saveDatabase();
  
  ctx.body = { success: true, message: '删除成功' };
});

module.exports = router;