const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../database');

const router = new Router();

const VALID_TYPES = ['pottery', 'bone', 'copper', 'stone', 'other'];

router.get('/square/:squareId', async (ctx) => {
  const db = getDatabase();
  const { squareId } = ctx.params;
  
  const result = db.exec(
    'SELECT * FROM artifacts WHERE square_id = ? ORDER BY created_at ASC',
    [squareId]
  );
  
  const artifacts = result.length > 0 ? result[0].values.map(row => {
    const columns = result[0].columns;
    return columns.reduce((obj, col, idx) => {
      obj[col] = row[idx];
      return obj;
    }, {});
  }) : [];
  
  ctx.body = { success: true, data: artifacts };
});

router.get('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const result = db.exec('SELECT * FROM artifacts WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '文物不存在' };
    return;
  }
  
  const columns = result[0].columns;
  const artifact = columns.reduce((obj, col, idx) => {
    obj[col] = result[0].values[0][idx];
    return obj;
  }, {});
  
  ctx.body = { success: true, data: artifact };
});

router.post('/', async (ctx) => {
  const db = getDatabase();
  const { square_id, layer_id, code, type, name, description, position_x, position_y, position_z } = ctx.request.body;
  
  if (!square_id || !code || !type) {
    ctx.status = 400;
    ctx.body = { success: false, message: '探方ID、文物编号和类型不能为空' };
    return;
  }
  
  if (!VALID_TYPES.includes(type)) {
    ctx.status = 400;
    ctx.body = { success: false, message: `无效的文物类型，必须是: ${VALID_TYPES.join(', ')}` };
    return;
  }
  
  const squareCheck = db.exec('SELECT id FROM squares WHERE id = ?', [square_id]);
  if (squareCheck.length === 0 || squareCheck[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '探方不存在' };
    return;
  }
  
  const codeCheck = db.exec('SELECT id FROM artifacts WHERE square_id = ? AND code = ?', [square_id, code]);
  if (codeCheck.length > 0 && codeCheck[0].values.length > 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: '该探方中已存在相同编号的文物' };
    return;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO artifacts (id, square_id, layer_id, code, type, name, description, position_x, position_y, position_z, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'found', ?)`,
    [id, square_id, layer_id || null, code, type, name || '', description || '', position_x || 0, position_y || 0, position_z || 0, now]
  );
  saveDatabase();
  
  ctx.body = { 
    success: true, 
    data: { 
      id, square_id, layer_id, code, type, name, description, 
      position_x, position_y, position_z, status: 'found', created_at: now 
    } 
  };
});

router.put('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  const { layer_id, code, type, name, description, position_x, position_y, position_z, status } = ctx.request.body;
  
  const checkResult = db.exec('SELECT id, square_id FROM artifacts WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '文物不存在' };
    return;
  }
  
  const squareId = checkResult[0].values[0][1];
  
  if (type && !VALID_TYPES.includes(type)) {
    ctx.status = 400;
    ctx.body = { success: false, message: `无效的文物类型，必须是: ${VALID_TYPES.join(', ')}` };
    return;
  }
  
  if (code) {
    const codeCheck = db.exec('SELECT id FROM artifacts WHERE square_id = ? AND code = ? AND id != ?', [squareId, code, id]);
    if (codeCheck.length > 0 && codeCheck[0].values.length > 0) {
      ctx.status = 400;
      ctx.body = { success: false, message: '该探方中已存在相同编号的文物' };
      return;
    }
  }
  
  const updates = [];
  const values = [];
  
  if (layer_id !== undefined) { updates.push('layer_id = ?'); values.push(layer_id); }
  if (code) { updates.push('code = ?'); values.push(code); }
  if (type) { updates.push('type = ?'); values.push(type); }
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (position_x !== undefined) { updates.push('position_x = ?'); values.push(position_x); }
  if (position_y !== undefined) { updates.push('position_y = ?'); values.push(position_y); }
  if (position_z !== undefined) { updates.push('position_z = ?'); values.push(position_z); }
  if (status) { updates.push('status = ?'); values.push(status); }
  
  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: '没有更新内容' };
    return;
  }
  
  values.push(id);
  
  db.run(`UPDATE artifacts SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  
  ctx.body = { success: true, message: '更新成功' };
});

router.delete('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const checkResult = db.exec('SELECT id FROM artifacts WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '文物不存在' };
    return;
  }
  
  db.run('DELETE FROM artifacts WHERE id = ?', [id]);
  saveDatabase();
  
  ctx.body = { success: true, message: '删除成功' };
});

module.exports = router;