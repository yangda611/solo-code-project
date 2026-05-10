const API_BASE = '/api';

export const api = {
  async getHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  async getPresets() {
    const response = await fetch(`${API_BASE}/presets`);
    return response.json();
  },

  async getPreset(name, levels = 3) {
    const response = await fetch(`${API_BASE}/presets/${name}?levels=${levels}`);
    return response.json();
  },

  async subdivide(vertices, faces, creases = [], levels = 1) {
    const response = await fetch(`${API_BASE}/subdivide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vertices, faces, creases, levels })
    });
    return response.json();
  },

  async applyProblems(vertices, faces, problems = []) {
    const response = await fetch(`${API_BASE}/apply-problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vertices, faces, problems })
    });
    return response.json();
  },

  async createProject(name) {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  async getProjects() {
    const response = await fetch(`${API_BASE}/projects`);
    return response.json();
  },

  async saveMesh(projectId, meshData) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/meshes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meshData)
    });
    return response.json();
  },

  async getMeshes(projectId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/meshes`);
    return response.json();
  },

  async saveHistory(projectId, actionType, meshSnapshot) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: actionType, mesh_snapshot: meshSnapshot })
    });
    return response.json();
  },

  async getHistory(projectId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/history`);
    return response.json();
  },

  async saveCreaseField(projectId, edgeData, weightMap) {
    const response = await fetch(`${API_BASE}/crease-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, edge_data: edgeData, weight_map: weightMap })
    });
    return response.json();
  },

  async getCreaseFields(projectId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/crease-fields`);
    return response.json();
  }
};

export default api;
