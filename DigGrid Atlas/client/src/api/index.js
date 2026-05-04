import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const squareApi = {
  list: () => api.get('/squares'),
  get: (id) => api.get(`/squares/${id}`),
  create: (data) => api.post('/squares', data),
  update: (id, data) => api.put(`/squares/${id}`, data),
  delete: (id) => api.delete(`/squares/${id}`)
}

export const layerApi = {
  getBySquare: (squareId) => api.get(`/layers/square/${squareId}`),
  get: (id) => api.get(`/layers/${id}`),
  create: (data) => api.post('/layers', data),
  update: (id, data) => api.put(`/layers/${id}`, data),
  strip: (id) => api.put(`/layers/${id}/strip`),
  delete: (id) => api.delete(`/layers/${id}`)
}

export const artifactApi = {
  getBySquare: (squareId) => api.get(`/artifacts/square/${squareId}`),
  get: (id) => api.get(`/artifacts/${id}`),
  create: (data) => api.post('/artifacts', data),
  update: (id, data) => api.put(`/artifacts/${id}`, data),
  delete: (id) => api.delete(`/artifacts/${id}`)
}

export const boundaryApi = {
  getBySquare: (squareId) => api.get(`/boundaries/square/${squareId}`),
  get: (id) => api.get(`/boundaries/${id}`),
  create: (data) => api.post('/boundaries', data),
  update: (id, data) => api.put(`/boundaries/${id}`, data),
  delete: (id) => api.delete(`/boundaries/${id}`)
}

export const logApi = {
  getBySquare: (squareId) => api.get(`/logs/square/${squareId}`),
  get: (id) => api.get(`/logs/${id}`),
  create: (data) => api.post('/logs', data),
  update: (id, data) => api.put(`/logs/${id}`, data),
  delete: (id) => api.delete(`/logs/${id}`)
}

export const presetApi = {
  list: () => api.get('/presets'),
  get: (code) => api.get(`/presets/${code}`),
  apply: (code, data = {}) => api.post(`/presets/apply/${code}`, data)
}

export default api