const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const cors = require('koa-cors');
const { initDatabase } = require('./database');
const squareRoutes = require('./routes/squares');
const layerRoutes = require('./routes/layers');
const artifactRoutes = require('./routes/artifacts');
const boundaryRoutes = require('./routes/boundaries');
const logRoutes = require('./routes/logs');
const presetRoutes = require('./routes/presets');

const app = new Koa();
const router = new Router();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(koaBody({
  multipart: true,
  jsonLimit: '10mb'
}));

router.get('/api/health', async (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

router.use('/api/squares', squareRoutes.routes(), squareRoutes.allowedMethods());
router.use('/api/layers', layerRoutes.routes(), layerRoutes.allowedMethods());
router.use('/api/artifacts', artifactRoutes.routes(), artifactRoutes.allowedMethods());
router.use('/api/boundaries', boundaryRoutes.routes(), boundaryRoutes.allowedMethods());
router.use('/api/logs', logRoutes.routes(), logRoutes.allowedMethods());
router.use('/api/presets', presetRoutes.routes(), presetRoutes.allowedMethods());

app.use(router.routes()).use(router.allowedMethods());

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`考古探方发掘管理系统后端服务已启动`);
      console.log(`服务地址: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

start();