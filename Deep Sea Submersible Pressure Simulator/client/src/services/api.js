import axios from 'axios'

const API_BASE = '/api'

export const api = {
  async getHealth() {
    const response = await axios.get(`${API_BASE}/health`)
    return response.data
  },

  async getMaterials() {
    const response = await axios.get(`${API_BASE}/materials`)
    return response.data
  },

  async getMaterial(id) {
    const response = await axios.get(`${API_BASE}/materials/${id}`)
    return response.data
  },

  async getPresets() {
    const response = await axios.get(`${API_BASE}/presets`)
    return response.data
  },

  async getPreset(id) {
    const response = await axios.get(`${API_BASE}/presets/${id}`)
    return response.data
  },

  async analyze(design, depth, temperature = 277.15) {
    const response = await axios.post(`${API_BASE}/analyze`, {
      design,
      depth,
      temperature
    })
    return response.data
  },

  async analyzeBatch(design, depths, temperature = 277.15) {
    const response = await axios.post(`${API_BASE}/analyze/batch`, {
      design,
      depths,
      temperature
    })
    return response.data
  },

  async getDesigns() {
    const response = await axios.get(`${API_BASE}/designs`)
    return response.data
  },

  async saveDesign(designData) {
    const response = await axios.post(`${API_BASE}/designs`, designData)
    return response.data
  },

  async updateDesign(id, designData) {
    const response = await axios.put(`${API_BASE}/designs/${id}`, designData)
    return response.data
  },

  async deleteDesign(id) {
    const response = await axios.delete(`${API_BASE}/designs/${id}`)
    return response.data
  },

  async getSimulations() {
    const response = await axios.get(`${API_BASE}/simulations`)
    return response.data
  },

  async saveSimulation(simulationData) {
    const response = await axios.post(`${API_BASE}/simulations`, simulationData)
    return response.data
  },

  async getDesignSimulations(designId) {
    const response = await axios.get(`${API_BASE}/simulations/design/${designId}`)
    return response.data
  },

  async getStats() {
    const response = await axios.get(`${API_BASE}/stats/summary`)
    return response.data
  }
}

export default api
