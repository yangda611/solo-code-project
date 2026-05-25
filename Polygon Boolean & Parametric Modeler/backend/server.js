const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const { GreinerHormann } = require('./greiner-hormann');
const Database = require('./database');

const app = new Koa();
const router = new Router();
const gh = new GreinerHormann();
const db = new Database();

app.use(cors());
app.use(bodyParser());

router.get('/api/health', async (ctx) => {
  ctx.body = { status: 'ok', message: 'Polygon Boolean API is running' };
});

router.post('/api/boolean', async (ctx) => {
  try {
    const { subject, clip, operation } = ctx.request.body;
    
    if (!subject || !clip || !operation) {
      ctx.status = 400;
      ctx.body = { error: 'Missing required parameters: subject, clip, operation' };
      return;
    }

    const selfIntersections = gh.detectSelfIntersections(subject);
    const clipSelfIntersections = gh.detectSelfIntersections(clip);

    let result;
    try {
      result = gh.clip(subject, clip, operation);
    } catch (error) {
      ctx.status = 500;
      ctx.body = { 
        error: 'Boolean operation failed',
        message: error.message,
        result: []
      };
      return;
    }

    const allIntersections = [];
    
    const subjectId = await db.savePolygon('subject', subject, false, '#4A90D9');
    const clipId = await db.savePolygon('clip', clip, false, '#D94A4A');
    const savedOp = await db.saveOperation(operation, subjectId.id, clipId.id, result, allIntersections);

    ctx.body = {
      success: true,
      operation,
      result,
      intersections: gh.intersections.map(i => ({ x: i.s.x, y: i.s.y })),
      selfIntersections: [...selfIntersections, ...clipSelfIntersections],
      operationId: savedOp.id,
      warnings: {
        hasSelfIntersections: selfIntersections.length > 0 || clipSelfIntersections.length > 0,
        hasCollinearEdges: false,
        hasDegeneratePolygons: result.some(p => p.length < 3)
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message, result: [] };
  }
});

router.get('/api/polygons', async (ctx) => {
  try {
    const polygons = await db.getAllPolygons();
    ctx.body = { success: true, polygons };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.get('/api/polygons/:id', async (ctx) => {
  try {
    const polygon = await db.getPolygon(ctx.params.id);
    if (polygon) {
      ctx.body = { success: true, polygon };
    } else {
      ctx.status = 404;
      ctx.body = { error: 'Polygon not found' };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.post('/api/polygons', async (ctx) => {
  try {
    const { name, points, isHole, color } = ctx.request.body;
    const polygon = await db.savePolygon(name, points, isHole, color);
    ctx.body = { success: true, polygon };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.delete('/api/polygons/:id', async (ctx) => {
  try {
    await db.deletePolygon(ctx.params.id);
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.get('/api/history', async (ctx) => {
  try {
    const history = await db.getOperationHistory(50);
    ctx.body = { success: true, history };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.get('/api/presets', async (ctx) => {
  const presets = {
    preset1: {
      name: '共线边界的退化多边形合并',
      description: '演示共线边的重复合并与数值容差导致的微小缝隙',
      subject: [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 250 },
        { x: 200, y: 250.001 },
        { x: 200, y: 180 },
        { x: 100, y: 180 }
      ],
      clip: [
        { x: 200, y: 150 },
        { x: 400, y: 150 },
        { x: 400, y: 300 },
        { x: 200, y: 300 }
      ],
      operation: 'union'
    },
    preset2: {
      name: '自交多边形的非简单区域解析',
      description: '演示自交多边形的处理和自交点标记',
      subject: [
        { x: 150, y: 100 },
        { x: 350, y: 100 },
        { x: 350, y: 300 },
        { x: 250, y: 200 },
        { x: 150, y: 300 },
        { x: 250, y: 180 }
      ],
      clip: [
        { x: 200, y: 150 },
        { x: 400, y: 150 },
        { x: 400, y: 350 },
        { x: 200, y: 350 }
      ],
      operation: 'intersection'
    },
    preset3: {
      name: '多点切触的奇异接触判定',
      description: '演示多个接触点的奇异边界处理',
      subject: [
        { x: 100, y: 100 },
        { x: 250, y: 100 },
        { x: 250, y: 250 },
        { x: 100, y: 250 }
      ],
      clip: [
        { x: 250, y: 150 },
        { x: 400, y: 150 },
        { x: 400, y: 300 },
        { x: 250, y: 300 }
      ],
      operation: 'union'
    },
    preset4: {
      name: '孔洞多边形差集运算的相反方向错误',
      description: '演示孔洞方向错误导致的内外反转问题',
      subject: [
        { x: 100, y: 100 },
        { x: 400, y: 100 },
        { x: 400, y: 350 },
        { x: 100, y: 350 }
      ],
      clip: [
        { x: 200, y: 150 },
        { x: 200, y: 280 },
        { x: 300, y: 280 },
        { x: 300, y: 150 }
      ],
      operation: 'difference'
    }
  };
  
  ctx.body = { success: true, presets };
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await db.init();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
