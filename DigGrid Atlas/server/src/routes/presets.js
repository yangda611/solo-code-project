const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../database');

const router = new Router();

router.get('/', async (ctx) => {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, code, description, created_at FROM presets ORDER BY created_at ASC');
  
  const presets = result.length > 0 ? result[0].values.map(row => {
    const columns = result[0].columns;
    return columns.reduce((obj, col, idx) => {
      obj[col] = row[idx];
      return obj;
    }, {});
  }) : [];
  
  ctx.body = { success: true, data: presets };
});

router.get('/:code', async (ctx) => {
  const db = getDatabase();
  const { code } = ctx.params;
  
  const result = db.exec('SELECT * FROM presets WHERE code = ?', [code]);
  if (result.length === 0 || result[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '预设不存在' };
    return;
  }
  
  const columns = result[0].columns;
  const preset = columns.reduce((obj, col, idx) => {
    obj[col] = result[0].values[0][idx];
    if (col === 'data') {
      try {
        obj[col] = JSON.parse(result[0].values[0][idx]);
      } catch (e) {
        obj[col] = result[0].values[0][idx];
      }
    }
    return obj;
  }, {});
  
  ctx.body = { success: true, data: preset };
});

router.post('/apply/:code', async (ctx) => {
  const db = getDatabase();
  const { code } = ctx.params;
  const { squareName, squareCode } = ctx.request.body;
  
  const presetResult = db.exec('SELECT * FROM presets WHERE code = ?', [code]);
  if (presetResult.length === 0 || presetResult[0].values.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: '预设不存在' };
    return;
  }
  
  let presetData;
  try {
    const dataStr = presetResult[0].values[0][presetResult[0].columns.indexOf('data')];
    presetData = JSON.parse(dataStr);
  } catch (e) {
    ctx.status = 500;
    ctx.body = { success: false, message: '预设数据解析失败' };
    return;
  }
  
  const squareId = uuidv4();
  const now = new Date().toISOString();
  
  const usedCode = squareCode || presetData.square.code;
  const codeCheck = db.exec('SELECT id FROM squares WHERE code = ?', [usedCode]);
  let finalCode = usedCode;
  let counter = 1;
  while (codeCheck.length > 0 && codeCheck[0].values.length > 0) {
    finalCode = `${usedCode}_${counter}`;
    const newCheck = db.exec('SELECT id FROM squares WHERE code = ?', [finalCode]);
    if (newCheck.length === 0 || newCheck[0].values.length === 0) {
      break;
    }
    counter++;
  }
  
  db.run(
    'INSERT INTO squares (id, name, code, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [squareId, squareName || presetData.square.name, finalCode, presetData.square.description || '', now, now]
  );
  
  const layerIdMap = new Map();
  for (const layer of presetData.layers || []) {
    const layerId = uuidv4();
    layerIdMap.set(layer.order_index, layerId);
    
    db.run(
      `INSERT INTO layers (id, square_id, name, color, depth_start, depth_end, description, order_index, is_stripped)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [layerId, squareId, layer.name, layer.color || '#8B4513', layer.depth_start || 0, 
       layer.depth_end || 0, layer.description || '', layer.order_index]
    );
  }
  
  for (const artifact of presetData.artifacts || []) {
    const artifactId = uuidv4();
    let layerId = null;
    
    if (artifact.layer_order !== undefined && layerIdMap.has(artifact.layer_order)) {
      layerId = layerIdMap.get(artifact.layer_order);
    }
    
    db.run(
      `INSERT INTO artifacts (id, square_id, layer_id, code, type, name, description, position_x, position_y, position_z, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'found', ?)`,
      [artifactId, squareId, layerId, artifact.code, artifact.type, artifact.name || '', 
       artifact.description || '', artifact.position_x || 0, artifact.position_y || 0, 
       artifact.position_z || 0, now]
    );
  }
  
  for (const boundary of presetData.boundaries || []) {
    const boundaryId = uuidv4();
    let layerId = null;
    if (boundary.layer_order !== undefined && layerIdMap.has(boundary.layer_order)) {
      layerId = layerIdMap.get(boundary.layer_order);
    }
    
    let pointsStr;
    if (typeof boundary.points === 'string') {
      pointsStr = boundary.points;
    } else {
      pointsStr = JSON.stringify(boundary.points);
    }
    
    db.run(
      `INSERT INTO boundaries (id, square_id, layer_id, name, type, points, color, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [boundaryId, squareId, layerId, boundary.name, boundary.type || 'relic', 
       pointsStr, boundary.color || '#FF0000', boundary.description || '']
    );
  }
  
  saveDatabase();
  
  ctx.body = { 
    success: true, 
    data: { 
      square_id: squareId,
      name: squareName || presetData.square.name,
      code: finalCode,
      message: '预设应用成功'
    }
  };
});

module.exports = router;