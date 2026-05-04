const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../database');

const router = new Router();

router.get('/square/:squareId', async (ctx) => {
  const db = getDatabase();
  const { squareId } = ctx.params;
  
  const result = db.exec(
    'SELECT * FROM logs WHERE square_id = ? ORDER BY created_at DESC',
    [squareId]
  );
  
  const logs = result.length > 0 ? result[0].values.map(row => {
    const columns = result[0].columns;
    return columns.reduce((obj, col, idx) => {
      obj[col] = row[idx];
      return obj;
    }, {});
  }) : [];
  
  ctx.body = { success: true, data: logs };
});

router.get('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const result = db.exec('SELECT * FROM logs WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '日志不存在' };
    return;
  }
  
  const columns = result[0].columns;
  const log = columns.reduce((obj, col, idx) => {
    obj[col] = result[0].values[0][idx];
    return obj;
  }, {});
  
  ctx.body = { success: true, data: log };
});

router.post('/', async (ctx) => {
  const db = getDatabase();
  const { square_id, title, content } = ctx.request.body;
  
  if (!square_id || !title || !content) {
    ctx.status = 400;
    ctx.body = { success: false, message: '探方ID、标题和内容不能为空' };
    return;
  }
  
  const squareCheck = db.exec('SELECT id FROM squares WHERE id = ?', [square_id]);
  if (squareCheck.length === 0 || squareCheck[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '探方不存在' };
    return;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO logs (id, square_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, square_id, title, content, now]
  );
  saveDatabase();
  
  ctx.body = { success: true, data: { id, square_id, title, content, created_at: now } };
});

router.put('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  const { title, content } = ctx.request.body;
  
  const checkResult = db.exec('SELECT id FROM logs WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '日志不存在' };
    return;
  }
  
  const updates = [];
  const values = [];
  
  if (title) { updates.push('title = ?'); values.push(title); }
  if (content) { updates.push('content = ?'); values.push(content); }
  
  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: '没有更新内容' };
    return;
  }
  
  values.push(id);
  
  db.run(`UPDATE logs SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  
  ctx.body = { success: true, message: '更新成功' };
});

router.delete('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const checkResult = db.exec('SELECT id FROM logs WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '日志不存在' };
    return;
  }
  
  db.run('DELETE FROM logs WHERE id = ?', [id]);
  saveDatabase();
  
  ctx.body = { success: true, message: '删除成功' };
});

module.exports = router;