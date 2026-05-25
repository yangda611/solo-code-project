const Koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const { initDatabase, savePreset, getPreset, getAllPresets, saveKeyframe, getKeyframes, saveMesh, saveSkinWeights, getMeshAndWeights } = require('./database');
const { Skeleton, CCDSolver, FABRIKSolver } = require('./ik-solver');

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());

app.use(async (ctx, next) => {
  console.log(`Request: ${ctx.method} ${ctx.url}`);
  await next();
});

const skeletonsCache = new Map();

function createSkeletonFromData(bonesData) {
  const skeleton = new Skeleton();
  const boneMap = new Map();
  
  bonesData.forEach(boneData => {
    const bone = skeleton.addBone(
      boneData.id,
      boneData.x,
      boneData.y,
      boneData.length,
      boneData.angle,
      boneData.parentId
    );
    if (boneData.constraint) {
      bone.setConstraint(boneData.constraint.min, boneData.constraint.max);
    }
    boneMap.set(boneData.id, bone);
  });
  
  return skeleton;
}

router.get('/api/presets', async (ctx) => {
  console.log('GET /api/presets called');
  const presets = await getAllPresets();
  ctx.body = { success: true, presets };
});

router.get('/api/presets/:name', async (ctx) => {
  const preset = await getPreset(ctx.params.name);
  ctx.body = { success: true, preset };
});

router.post('/api/presets', async (ctx) => {
  const { name, description, bonesData } = ctx.request.body;
  const id = await savePreset(name, description, bonesData);
  ctx.body = { success: true, id };
});

router.post('/api/ik/solve', async (ctx) => {
  const { bonesData, target, solverType, maxIterations, threshold } = ctx.request.body;
  
  const skeleton = createSkeletonFromData(bonesData);
  skeleton.updatePositions();
  
  let solver;
  if (solverType === 'ccd') {
    solver = new CCDSolver(skeleton);
  } else {
    solver = new FABRIKSolver(skeleton);
  }
  
  solver.setParams(maxIterations || 100, threshold || 0.1);
  const result = solver.solve(target);
  
  const boneAngles = {};
  skeleton.bones.forEach(bone => {
    boneAngles[bone.id] = bone.actualAngle;
  });
  
  ctx.body = {
    success: true,
    result: {
      ...result,
      boneAngles
    }
  };
});

router.post('/api/keyframes', async (ctx) => {
  const { presetId, frameNumber, bonesAngles } = ctx.request.body;
  const id = await saveKeyframe(presetId, frameNumber, bonesAngles);
  ctx.body = { success: true, id };
});

router.get('/api/keyframes/:presetId', async (ctx) => {
  const keyframes = await getKeyframes(parseInt(ctx.params.presetId));
  ctx.body = { success: true, keyframes };
});

router.post('/api/mesh', async (ctx) => {
  const { presetId, vertices, weights } = ctx.request.body;
  await saveMesh(presetId, vertices);
  await saveSkinWeights(presetId, weights);
  ctx.body = { success: true };
});

router.get('/api/mesh/:presetId', async (ctx) => {
  const data = await getMeshAndWeights(parseInt(ctx.params.presetId));
  ctx.body = { success: true, ...data };
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = 3000;

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
