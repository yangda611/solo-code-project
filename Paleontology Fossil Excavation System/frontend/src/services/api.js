import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const sceneService = {
  getAll: () => api.get('/scenes'),
  get: (name) => api.get(`/scenes/${encodeURIComponent(name)}`),
  load: (name) => api.post(`/scenes/${encodeURIComponent(name)}/load`)
};

export const profileService = {
  create: (data) => api.post('/profiles', data),
  get: (id) => api.get(`/profiles/${id}`),
  getFragments: (id) => api.get(`/profiles/${id}/fragments`),
  discoverFragment: (id, fragmentId, discovered) => 
    api.post(`/profiles/${id}/fragments/discover`, { fragmentId, discovered }),
  useTool: (id, toolType, intensity, targetFragmentId) =>
    api.post(`/profiles/${id}/tool/use`, { toolType, intensity, targetFragmentId }),
  applyWeathering: (id, timeExposed, accelerationFactor = 1) =>
    api.post(`/profiles/${id}/weathering`, { timeExposed, accelerationFactor }),
  matchFragments: (id) => api.post(`/profiles/${id}/match`),
  matchPair: (id, fragmentId1, fragmentId2) =>
    api.post(`/profiles/${id}/match/pair`, { fragmentId1, fragmentId2 }),
  validateBiomechanics: (id, topology) =>
    api.post(`/profiles/${id}/biomechanics/validate`, { topology }),
  updateTopology: (id, data) =>
    api.post(`/profiles/${id}/topology/update`, data),
  analyzeStratigraphy: (id, data) =>
    api.post(`/profiles/${id}/analysis/stratigraphy`, data),
  analyzeTectonic: (id, tiltAngle) =>
    api.post(`/profiles/${id}/analysis/tectonic`, { tiltAngle }),
  analyzeFragmentation: (id) =>
    api.post(`/profiles/${id}/analysis/fragmentation`),
  getLogs: (id) => api.get(`/profiles/${id}/logs`),
  reconstruct: (id) => api.post(`/profiles/${id}/reconstruct`)
};

export default api;
