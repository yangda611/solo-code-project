const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../database');

const router = new Router();

router.get('/', async (ctx) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM squares ORDER BY created_at DESC');
  const squares = result.length > 0 ? result[0].values.map(row => {
    const columns = result[0].columns;
    return columns.reduce((obj, col, idx) => {
      obj[col] = row[idx];
      return obj;
    }, {});
  }) : [];
  ctx.body = { success: true, data: squares };
});

router.get('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const result = db.exec('SELECT * FROM squares WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '探方不存在' };
    return;
  }
  
  const columns = result[0].columns;
  const square = columns.reduce((obj, col, idx) => {
    obj[col] = result[0].values[0][idx];
    return obj;
  }, {});
  
  ctx.body = { success: true, data: square };
});

router.post('/', async (ctx) => {
  const db = getDatabase();
  const { name, code, description } = ctx.request.body;
  
  if (!name || !code) {
    ctx.status = 400;
    ctx.body = { success: false, message: '名称和编号不能为空' };
    return;
  }
  
  const checkResult = db.exec('SELECT id FROM squares WHERE code = ?', [code]);
  if (checkResult.length > 0 && checkResult[0].values.length > 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: '探方编号已存在' };
    return;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO squares (id, name, code, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, code, description || '', now, now]
  );
  saveDatabase();
  
  ctx.body = { success: true, data: { id, name, code, description } };
});

router.put('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  const { name, code, description } = ctx.request.body;
  
  const checkResult = db.exec('SELECT id FROM squares WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '探方不存在' };
    return;
  }
  
  if (code) {
    const codeCheck = db.exec('SELECT id FROM squares WHERE code = ? AND id != ?', [code, id]);
    if (codeCheck.length > 0 && codeCheck[0].values.length > 0) {
      ctx.status = 400;
      ctx.body = { success: false, message: '探方编号已被使用' };
      return;
    }
  }
  
  const now = new Date().toISOString();
  const updates = [];
  const values = [];
  
  if (name) { updates.push('name = ?'); values.push(name); }
  if (code) { updates.push('code = ?'); values.push(code); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  db.run(`UPDATE squares SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  
  ctx.body = { success: true, message: '更新成功' };
});

router.delete('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const checkResult = db.exec('SELECT id FROM squares WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '探方不存在' };
    return;
  }
  
  db.run('DELETE FROM logs WHERE square_id = ?', [id]);
  db.run('DELETE FROM boundaries WHERE square_id = ?', [id]);
  db.run('DELETE FROM artifacts WHERE square_id = ?', [id]);
  db.run('DELETE FROM layers WHERE square_id = ?', [id]);
  db.run('DELETE FROM squares WHERE id = ?', [id]);
  saveDatabase();
  
  ctx.body = { success: true, message: '删除成功' };
});

module.exports = router;