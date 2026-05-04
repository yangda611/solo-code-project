const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../database');

const router = new Router();

const VALID_TYPES = ['relic', 'tomb', 'pit', 'foundation', 'wall', 'other'];

router.get('/square/:squareId', async (ctx) => {
  const db = getDatabase();
  const { squareId } = ctx.params;
  
  const result = db.exec(
    'SELECT * FROM boundaries WHERE square_id = ?',
    [squareId]
  );
  
  const boundaries = result.length > 0 ? result[0].values.map(row => {
    const columns = result[0].columns;
    return columns.reduce((obj, col, idx) => {
      obj[col] = row[idx];
      if (col === 'points') {
        try {
          obj[col] = JSON.parse(row[idx]);
        } catch (e) {
          obj[col] = row[idx];
        }
      }
      return obj;
    }, {});
  }) : [];
  
  ctx.body = { success: true, data: boundaries };
});

router.get('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const result = db.exec('SELECT * FROM boundaries WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '边界不存在' };
    return;
  }
  
  const columns = result[0].columns;
  const boundary = columns.reduce((obj, col, idx) => {
    obj[col] = result[0].values[0][idx];
    if (col === 'points') {
      try {
        obj[col] = JSON.parse(result[0].values[0][idx]);
      } catch (e) {
        obj[col] = result[0].values[0][idx];
      }
    }
    return obj;
  }, {});
  
  ctx.body = { success: true, data: boundary };
});

router.post('/', async (ctx) => {
  const db = getDatabase();
  const { square_id, layer_id, name, type, points, color, description } = ctx.request.body;
  
  if (!square_id || !name || !points) {
    ctx.status = 400;
    ctx.body = { success: false, message: '探方ID、名称和点数据不能为空' };
    return;
  }
  
  if (type && !VALID_TYPES.includes(type)) {
    ctx.status = 400;
    ctx.body = { success: false, message: `无效的边界类型，必须是: ${VALID_TYPES.join(', ')}` };
    return;
  }
  
  const squareCheck = db.exec('SELECT id FROM squares WHERE id = ?', [square_id]);
  if (squareCheck.length === 0 || squareCheck[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '探方不存在' };
    return;
  }
  
  let pointsStr;
  try {
    if (typeof points === 'string') {
      pointsStr = points;
      JSON.parse(points);
    } else {
      pointsStr = JSON.stringify(points);
    }
  } catch (e) {
    ctx.status = 400;
    ctx.body = { success: false, message: '点数据格式无效' };
    return;
  }
  
  const id = uuidv4();
  
  db.run(
    `INSERT INTO boundaries (id, square_id, layer_id, name, type, points, color, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, square_id, layer_id || null, name, type || 'relic', pointsStr, color || '#FF0000', description || '']
  );
  saveDatabase();
  
  ctx.body = { 
    success: true, 
    data: { 
      id, square_id, layer_id, name, type: type || 'relic', 
      points: typeof points === 'string' ? JSON.parse(points) : points, 
      color: color || '#FF0000', description 
    } 
  };
});

router.put('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  const { name, type, points, color, description, layer_id } = ctx.request.body;
  
  const checkResult = db.exec('SELECT id FROM boundaries WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '边界不存在' };
    return;
  }
  
  if (type && !VALID_TYPES.includes(type)) {
    ctx.status = 400;
    ctx.body = { success: false, message: `无效的边界类型，必须是: ${VALID_TYPES.join(', ')}` };
    return;
  }
  
  const updates = [];
  const values = [];
  
  if (layer_id !== undefined) { updates.push('layer_id = ?'); values.push(layer_id); }
  if (name) { updates.push('name = ?'); values.push(name); }
  if (type) { updates.push('type = ?'); values.push(type); }
  if (color) { updates.push('color = ?'); values.push(color); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  
  if (points) {
    let pointsStr;
    try {
      if (typeof points === 'string') {
        pointsStr = points;
        JSON.parse(points);
      } else {
        pointsStr = JSON.stringify(points);
      }
      updates.push('points = ?');
      values.push(pointsStr);
    } catch (e) {
      ctx.status = 400;
      ctx.body = { success: false, message: '点数据格式无效' };
      return;
    }
  }
  
  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: '没有更新内容' };
    return;
  }
  
  values.push(id);
  
  db.run(`UPDATE boundaries SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  
  ctx.body = { success: true, message: '更新成功' };
});

router.delete('/:id', async (ctx) => {
  const db = getDatabase();
  const { id } = ctx.params;
  
  const checkResult = db.exec('SELECT id FROM boundaries WHERE id = ?', [id]);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '边界不存在' };
    return;
  }
  
  db.run('DELETE FROM boundaries WHERE id = ?', [id]);
  saveDatabase();
  
  ctx.body = { success: true, message: '删除成功' };
});

module.exports = router;