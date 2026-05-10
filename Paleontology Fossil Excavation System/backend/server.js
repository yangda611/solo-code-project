import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  initDatabase,
  getAllScenes,
  getSceneByName,
  createProfile,
  getProfile,
  addFragments,
  getFragments,
  updateFragment,
  addTopology,
  getTopology,
  addLog,
  getLogs
} from './database.js';

import {
  calculateBoneMatch,
  estimateJointAngles,
  validateBiomechanics,
  applyToolDamage,
  applyWeathering,
  calculateStratigraphicError,
  calculateTectonicBias,
  analyzeFragmentationPattern,
  matchAllFragments
} from './algorithms.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true
});

await initDatabase();

fastify.get('/api/scenes', async (request, reply) => {
  const scenes = getAllScenes();
  return { scenes };
});

fastify.get('/api/scenes/:name', async (request, reply) => {
  const { name } = request.params;
  const scene = getSceneByName(decodeURIComponent(name));
  
  if (!scene) {
    return reply.code(404).send({ error: 'Scene not found' });
  }
  
  return scene;
});

fastify.post('/api/scenes/:name/load', async (request, reply) => {
  const { name } = request.params;
  const scene = getSceneByName(decodeURIComponent(name));
  
  if (!scene) {
    return reply.code(404).send({ error: 'Scene not found' });
  }
  
  const profileId = createProfile({
    name: scene.name,
    scene_type: scene.type,
    layers: scene.data.layers
  });
  
  addFragments(profileId, scene.data.fragments);
  
  addTopology(profileId, scene.data.skeleton.map(s => ({
    bone: s.bone,
    parent: s.parent,
    joint: s.joint,
    angles: s.angles,
    confidence: 0.8,
    biomechanicsValid: true
  })));
  
  return {
    profileId,
    layers: scene.data.layers,
    fragments: getFragments(profileId),
    skeleton: scene.data.skeleton,
    sceneType: scene.type,
    description: scene.description
  };
});

fastify.post('/api/profiles', async (request, reply) => {
  const { name, sceneType, layers } = request.body;
  const profileId = createProfile({ name, scene_type: sceneType, layers });
  return { id: profileId, name, sceneType, layers };
});

fastify.get('/api/profiles/:id', async (request, reply) => {
  const { id } = request.params;
  const profile = getProfile(id);
  
  if (!profile) {
    return reply.code(404).send({ error: 'Profile not found' });
  }
  
  return profile;
});

fastify.get('/api/profiles/:id/fragments', async (request, reply) => {
  const { id } = request.params;
  const fragments = getFragments(parseInt(id));
  return { fragments };
});

fastify.post('/api/profiles/:id/fragments/discover', async (request, reply) => {
  const { id } = request.params;
  const { fragmentId, discovered } = request.body;
  
  updateFragment(parseInt(fragmentId), {
    discovered: discovered ? 1 : 0
  });
  
  addLog(parseInt(id), {
    toolType: 'discovery',
    intensity: 0,
    action: discovered ? 'discover' : 'hide',
    fragmentId: parseInt(fragmentId)
  });
  
  return { success: true, fragmentId, discovered };
});

fastify.post('/api/profiles/:id/tool/use', async (request, reply) => {
  const { id } = request.params;
  const { toolType, intensity, targetFragmentId, duration } = request.body;
  
  const fragments = getFragments(parseInt(id));
  const results = [];
  let affectedFragment = null;
  
  if (targetFragmentId) {
    const fragment = fragments.find(f => f.id === parseInt(targetFragmentId));
    if (fragment) {
      const damage = applyToolDamage(fragment, toolType, intensity);
      updateFragment(parseInt(targetFragmentId), damage);
      affectedFragment = { id: fragment.id, ...damage };
    }
  }
  
  addLog(parseInt(id), {
    toolType,
    intensity,
    action: 'use_tool',
    fragmentId: targetFragmentId
  });
  
  const updatedFragments = getFragments(parseInt(id));
  
  return {
    success: true,
    toolType,
    intensity,
    affectedFragment,
    fragments: updatedFragments,
    warning: affectedFragment?.damaged 
      ? `警告: 化石碎片已受到严重损伤 (损伤度: ${(affectedFragment.erosion_level * 100).toFixed(0)}%)`
      : null
  };
});

fastify.post('/api/profiles/:id/weathering', async (request, reply) => {
  const { id } = request.params;
  const { timeExposed, accelerationFactor } = request.body;
  
  const fragments = getFragments(parseInt(id));
  const results = [];
  const crumblingFragments = [];
  
  for (const fragment of fragments) {
    if (fragment.discovered) {
      const weathering = applyWeathering(
        fragment,
        timeExposed,
        accelerationFactor || 1
      );
      
      updateFragment(fragment.id, {
        weathering_level: weathering.weathering_level,
        exposed_time: (fragment.exposed_time || 0) + timeExposed
      });
      
      results.push({
        id: fragment.id,
        name: fragment.name,
        weathering_level: weathering.weathering_level,
        crumbling: weathering.crumbling,
        fragile: weathering.fragile
      });
      
      if (weathering.crumbling) {
        crumblingFragments.push(fragment.name);
      }
    }
  }
  
  return {
    success: true,
    timeExposed,
    results,
    warning: crumblingFragments.length > 0
      ? `警告: 以下化石碎片已出现酥解迹象: ${crumblingFragments.join(', ')}`
      : null
  };
});

fastify.post('/api/profiles/:id/match', async (request, reply) => {
  const { id } = request.params;
  const fragments = getFragments(parseInt(id));
  
  const discoveredFragments = fragments.filter(f => f.discovered);
  const matches = matchAllFragments(discoveredFragments);
  
  return {
    totalFragments: fragments.length,
    discoveredCount: discoveredFragments.length,
    matches: matches.slice(0, 20),
    bestMatch: matches[0] || null
  };
});

fastify.post('/api/profiles/:id/match/pair', async (request, reply) => {
  const { id } = request.params;
  const { fragmentId1, fragmentId2 } = request.body;
  
  const fragments = getFragments(parseInt(id));
  const f1 = fragments.find(f => f.id === parseInt(fragmentId1));
  const f2 = fragments.find(f => f.id === parseInt(fragmentId2));
  
  if (!f1 || !f2) {
    return reply.code(404).send({ error: 'Fragment not found' });
  }
  
  const match = calculateBoneMatch(f1, f2);
  const jointAngles = estimateJointAngles(
    f1,
    f2,
    match.confidence > 0.5 ? 'ball' : 'hinge'
  );
  
  return {
    fragment1: { id: f1.id, name: f1.name, type: f1.bone_type },
    fragment2: { id: f2.id, name: f2.name, type: f2.bone_type },
    match,
    estimatedJoint: {
      type: match.confidence > 0.5 ? 'ball' : 'hinge',
      angles: jointAngles,
      anglesDegrees: jointAngles
    }
  };
});

fastify.post('/api/profiles/:id/biomechanics/validate', async (request, reply) => {
  const { id } = request.params;
  const { topology } = request.body;
  
  const fragments = getFragments(parseInt(id));
  const dbTopology = getTopology(parseInt(id));
  
  const topoToValidate = topology || dbTopology.map(t => ({
    bone_name: t.bone_name,
    parent_bone: t.parent_bone,
    joint_type: t.joint_type,
    joint_angle_x: t.joint_angle_x,
    joint_angle_y: t.joint_angle_y,
    joint_angle_z: t.joint_angle_z
  }));
  
  const validation = validateBiomechanics(topoToValidate, fragments);
  
  return {
    profileId: id,
    valid: validation.valid,
    issues: validation.issues,
    validJoints: validation.validJoints,
    summary: validation.valid
      ? '所有关节配置符合生物力学约束'
      : `发现 ${validation.issues.length} 个生物力学问题`
  };
});

fastify.post('/api/profiles/:id/topology/update', async (request, reply) => {
  const { id } = request.params;
  const { boneName, parentBone, jointType, angles } = request.body;
  
  const existingTopology = getTopology(parseInt(id));
  const existing = existingTopology.find(t => t.bone_name === boneName);
  
  const result = validateBiomechanics([{
    bone_name: boneName,
    parent_bone: parentBone,
    joint_type: jointType,
    joint_angle_x: angles[0],
    joint_angle_y: angles[1],
    joint_angle_z: angles[2]
  }], getFragments(parseInt(id)));
  
  return {
    success: true,
    biomechanicsValid: result.valid,
    issues: result.issues,
    update: {
      boneName,
      parentBone,
      jointType,
      angles
    }
  };
});

fastify.post('/api/profiles/:id/analysis/stratigraphy', async (request, reply) => {
  const { id } = request.params;
  const { layers, discoveredLayer, trueLayer } = request.body;
  
  const profile = getProfile(parseInt(id));
  const layerData = layers || profile.layers;
  
  const error = calculateStratigraphicError(
    layerData,
    parseInt(discoveredLayer),
    parseInt(trueLayer)
  );
  
  return {
    profileId: id,
    stratigraphicError: error,
    layers: layerData,
    discoveredLayer,
    trueLayer,
    recommendation: error.error === 0
      ? '层位判断准确，可以继续发掘'
      : `建议重新检查层位划分，当前误差可能影响 ${error.ageError} 百万年的年代学解释`
  };
});

fastify.post('/api/profiles/:id/analysis/tectonic', async (request, reply) => {
  const { id } = request.params;
  const { tiltAngle } = request.body;
  
  const fragments = getFragments(parseInt(id));
  const bias = calculateTectonicBias(fragments, tiltAngle || 5);
  
  return {
    profileId: id,
    tectonicBias: bias,
    recommendation: bias.averageBias.x > 0.1 || bias.averageBias.z > 0.1
      ? '地层倾斜已造成显著坐标偏差，建议进行大地测量校正'
      : '当前倾斜角度造成的坐标偏差在可接受范围内'
  };
});

fastify.post('/api/profiles/:id/analysis/fragmentation', async (request, reply) => {
  const { id } = request.params;
  
  const fragments = getFragments(parseInt(id));
  const analysis = analyzeFragmentationPattern(fragments);
  
  return {
    profileId: id,
    fragmentationAnalysis: analysis,
    interpretation: analysis.quality.overall > 0.7
      ? '化石保存状况良好，适合进行详细的骨骼学研究'
      : analysis.quality.overall > 0.4
      ? '化石有一定程度的损伤，但仍可进行复原工作'
      : '化石损伤严重，可能影响复原结果的准确性'
  };
});

fastify.get('/api/profiles/:id/logs', async (request, reply) => {
  const { id } = request.params;
  const logs = getLogs(parseInt(id));
  return { logs, count: logs.length };
});

fastify.post('/api/profiles/:id/reconstruct', async (request, reply) => {
  const { id } = request.params;
  
  const fragments = getFragments(parseInt(id));
  const topology = getTopology(parseInt(id));
  const discovered = fragments.filter(f => f.discovered);
  
  const matches = matchAllFragments(discovered);
  const biomechanics = validateBiomechanics(topology, fragments);
  const fragAnalysis = analyzeFragmentationPattern(discovered);
  
  const reconstructedSkeleton = topology.map(t => {
    const fragment = fragments.find(f => 
      f.bone_type === t.bone_name || 
      f.name.includes(t.bone_name)
    );
    
    return {
      bone: t.bone_name,
      parent: t.parent_bone,
      jointType: t.joint_type,
      angles: [t.joint_angle_x, t.joint_angle_y, t.joint_angle_z],
      position: fragment ? [fragment.position_x, fragment.position_y, fragment.position_z] : null,
      rotation: fragment ? [fragment.rotation_x, fragment.rotation_y, fragment.rotation_z] : null,
      discovered: fragment ? fragment.discovered : false,
      quality: fragment ? 1 - (fragment.erosion_level + fragment.weathering_level) / 2 : 0
    };
  });
  
  return {
    profileId: id,
    reconstruction: {
      totalFragments: fragments.length,
      discoveredFragments: discovered.length,
      discoveredPercentage: (discovered.length / fragments.length * 100).toFixed(1),
      successfulMatches: matches.filter(m => m.confidence > 0.6).length,
      biomechanicsValid: biomechanics.valid,
      biomechanicsIssues: biomechanics.issues,
      overallQuality: fragAnalysis.quality.overall,
      skeleton: reconstructedSkeleton,
      status: discovered.length >= fragments.length * 0.7
        ? '复原完成度良好，可以生成行走动画'
        : '需要发掘更多化石碎片以完成完整复原'
    },
    matches: matches.filter(m => m.confidence > 0.5).slice(0, 10)
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Fossil Excavation System Backend running on http://localhost:3001');
    console.log('Available scenes:');
    const scenes = getAllScenes();
    scenes.forEach(s => console.log(`  - ${s.name}`));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
