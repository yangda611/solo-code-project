import Fastify from 'fastify';
import cors from '@fastify/cors';
import subdivider from './catmull-clark.js';
import presets from './presets.js';

const fastify = Fastify({ logger: true });

const projects = new Map();
let nextProjectId = 1;

const meshes = new Map();
let nextMeshId = 1;

const history = new Map();
let nextHistoryId = 1;

const creaseFields = new Map();
let nextCreaseFieldId = 1;

await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

fastify.get('/presets', async (request, reply) => {
  const result = {};
  for (const [key, preset] of Object.entries(presets)) {
    const mesh = preset.generate();
    const levels = subdivider.subdivide(mesh.vertices, mesh.faces, mesh.creases, 3);
    
    result[key] = {
      name: preset.name,
      description: preset.description,
      levels: levels.map((level, idx) => ({
        level: idx,
        vertices: level.vertices,
        faces: level.faces,
        creases: level.creases,
        normals: subdivider.computeNormals(level.vertices, level.faces)
      }))
    };
  }
  return result;
});

fastify.get('/presets/:name', async (request, reply) => {
  const { name } = request.params;
  const preset = presets[name];
  
  if (!preset) {
    reply.code(404).send({ error: 'Preset not found' });
    return;
  }
  
  const mesh = preset.generate();
  const { levels = 3 } = request.query || {};
  const levelNum = parseInt(levels);
  
  const subdivisionLevels = subdivider.subdivide(
    mesh.vertices,
    mesh.faces,
    mesh.creases,
    levelNum
  );
  
  return {
    name: preset.name,
    description: preset.description,
    levels: subdivisionLevels.map((level, idx) => ({
      level: idx,
      vertices: level.vertices,
      faces: level.faces,
      creases: level.creases,
      normals: subdivider.computeNormals(level.vertices, level.faces)
    }))
  };
});

fastify.post('/subdivide', async (request, reply) => {
  const { vertices, faces, creases = [], levels = 1 } = request.body;
  
  if (!vertices || !faces) {
    reply.code(400).send({ error: 'Missing vertices or faces' });
    return;
  }
  
  const subdivisionLevels = subdivider.subdivide(vertices, faces, creases, levels);
  
  return {
    levels: subdivisionLevels.map((level, idx) => ({
      level: idx,
      vertices: level.vertices,
      faces: level.faces,
      creases: level.creases,
      normals: subdivider.computeNormals(level.vertices, level.faces)
    }))
  };
});

fastify.post('/apply-problems', async (request, reply) => {
  const { vertices, faces, problems = [] } = request.body;
  
  let currentMesh = {
    vertices: vertices.map(v => [...v]),
    faces: faces.map(f => [...f])
  };
  
  for (const problem of problems) {
    currentMesh = subdivider.applyProblems(currentMesh, problem);
  }
  
  return {
    vertices: currentMesh.vertices,
    faces: currentMesh.faces,
    normals: subdivider.computeNormals(currentMesh.vertices, currentMesh.faces)
  };
});

fastify.post('/projects', async (request, reply) => {
  const { name = 'Untitled Project' } = request.body;
  const id = nextProjectId++;
  const project = { id, name, created_at: new Date().toISOString() };
  projects.set(id, project);
  return project;
});

fastify.get('/projects', async (request, reply) => {
  return Array.from(projects.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

fastify.post('/projects/:id/meshes', async (request, reply) => {
  const { id } = request.params;
  const { subdivision_level = 0, vertices, faces, creases = [], normals = null } = request.body;
  
  const meshId = nextMeshId++;
  const mesh = {
    id: meshId,
    project_id: parseInt(id),
    subdivision_level,
    vertices,
    faces,
    creases,
    normals,
    created_at: new Date().toISOString()
  };
  
  meshes.set(meshId, mesh);
  return { id: meshId };
});

fastify.get('/projects/:id/meshes', async (request, reply) => {
  const { id } = request.params;
  return Array.from(meshes.values())
    .filter(m => m.project_id === parseInt(id))
    .sort((a, b) => a.subdivision_level - b.subdivision_level);
});

fastify.post('/projects/:id/history', async (request, reply) => {
  const { id } = request.params;
  const { action_type, mesh_snapshot } = request.body;
  
  const historyId = nextHistoryId++;
  const record = {
    id: historyId,
    project_id: parseInt(id),
    action_type,
    mesh_snapshot,
    timestamp: new Date().toISOString()
  };
  
  history.set(historyId, record);
  return { id: historyId };
});

fastify.get('/projects/:id/history', async (request, reply) => {
  const { id } = request.params;
  return Array.from(history.values())
    .filter(h => h.project_id === parseInt(id))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

fastify.post('/crease-fields', async (request, reply) => {
  const { project_id, edge_data, weight_map } = request.body;
  
  const id = nextCreaseFieldId++;
  const field = {
    id,
    project_id,
    edge_data,
    weight_map,
    created_at: new Date().toISOString()
  };
  
  creaseFields.set(id, field);
  return { id };
});

fastify.get('/projects/:id/crease-fields', async (request, reply) => {
  const { id } = request.params;
  return Array.from(creaseFields.values())
    .filter(cf => cf.project_id === parseInt(id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
