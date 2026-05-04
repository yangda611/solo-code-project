import type { 
  Preset, Fish, Coral, Device, WaterParameters, 
  LightingSchedule, FeedingSchedule, Alert, FullState 
} from '$lib/types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

export const presetApi = {
  getAll: () => fetchJson<Preset[]>(`${API_BASE}/presets`),
  getById: (id: number) => fetchJson<Preset>(`${API_BASE}/presets/${id}`),
  getActive: () => fetchJson<Preset>(`${API_BASE}/presets/active`),
  getFullState: () => fetchJson<FullState>(`${API_BASE}/presets/state`),
  setActive: (presetId: number) => 
    fetchJson(`${API_BASE}/presets/active`, {
      method: 'POST',
      body: JSON.stringify({ presetId })
    }),
  create: (name: string, description: string) =>
    fetchJson<Preset>(`${API_BASE}/presets`, {
      method: 'POST',
      body: JSON.stringify({ name, description })
    }),
  update: (id: number, name: string, description: string) =>
    fetchJson<Preset>(`${API_BASE}/presets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description })
    }),
  delete: (id: number) =>
    fetchJson(`${API_BASE}/presets/${id}`, { method: 'DELETE' })
};

export const fishApi = {
  getAll: (presetId?: number) => 
    fetchJson<Fish[]>(`${API_BASE}/fish${presetId ? `?presetId=${presetId}` : ''}`),
  getById: (id: number) => fetchJson<Fish>(`${API_BASE}/fish/${id}`),
  create: (data: Partial<Fish>) =>
    fetchJson<Fish>(`${API_BASE}/fish`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: number, data: Partial<Fish>) =>
    fetchJson<Fish>(`${API_BASE}/fish/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id: number) =>
    fetchJson(`${API_BASE}/fish/${id}`, { method: 'DELETE' })
};

export const coralApi = {
  getAll: (presetId?: number) => 
    fetchJson<Coral[]>(`${API_BASE}/corals${presetId ? `?presetId=${presetId}` : ''}`),
  getById: (id: number) => fetchJson<Coral>(`${API_BASE}/corals/${id}`),
  create: (data: Partial<Coral>) =>
    fetchJson<Coral>(`${API_BASE}/corals`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: number, data: Partial<Coral>) =>
    fetchJson<Coral>(`${API_BASE}/corals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id: number) =>
    fetchJson(`${API_BASE}/corals/${id}`, { method: 'DELETE' })
};

export const deviceApi = {
  getAll: (presetId?: number) => 
    fetchJson<Device[]>(`${API_BASE}/devices${presetId ? `?presetId=${presetId}` : ''}`),
  getById: (id: number) => fetchJson<Device>(`${API_BASE}/devices/${id}`),
  create: (data: Partial<Device>) =>
    fetchJson<Device>(`${API_BASE}/devices`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: number, data: Partial<Device>) =>
    fetchJson<Device>(`${API_BASE}/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  updateStatus: (id: number, status: string, power: number) =>
    fetchJson<Device>(`${API_BASE}/devices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, power })
    }),
  delete: (id: number) =>
    fetchJson(`${API_BASE}/devices/${id}`, { method: 'DELETE' })
};

export const waterApi = {
  getCurrent: (presetId: number) => 
    fetchJson<WaterParameters>(`${API_BASE}/water?presetId=${presetId}`),
  getHistory: (presetId: number, limit?: number) =>
    fetchJson<WaterParameters[]>(
      `${API_BASE}/water/history?presetId=${presetId}${limit ? `&limit=${limit}` : ''}`
    ),
  create: (data: Partial<WaterParameters>) =>
    fetchJson<WaterParameters>(`${API_BASE}/water`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

export const lightingApi = {
  getAll: (presetId?: number) => 
    fetchJson<LightingSchedule[]>(`${API_BASE}/lighting${presetId ? `?presetId=${presetId}` : ''}`),
  getById: (id: number) => fetchJson<LightingSchedule>(`${API_BASE}/lighting/${id}`),
  create: (data: Partial<LightingSchedule>) =>
    fetchJson<LightingSchedule>(`${API_BASE}/lighting`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: number, data: Partial<LightingSchedule>) =>
    fetchJson<LightingSchedule>(`${API_BASE}/lighting/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  toggle: (id: number) =>
    fetchJson<LightingSchedule>(`${API_BASE}/lighting/${id}/toggle`, {
      method: 'PATCH'
    }),
  delete: (id: number) =>
    fetchJson(`${API_BASE}/lighting/${id}`, { method: 'DELETE' })
};

export const feedingApi = {
  getAll: (presetId?: number) => 
    fetchJson<FeedingSchedule[]>(`${API_BASE}/feeding${presetId ? `?presetId=${presetId}` : ''}`),
  getById: (id: number) => fetchJson<FeedingSchedule>(`${API_BASE}/feeding/${id}`),
  create: (data: Partial<FeedingSchedule>) =>
    fetchJson<FeedingSchedule>(`${API_BASE}/feeding`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: number, data: Partial<FeedingSchedule>) =>
    fetchJson<FeedingSchedule>(`${API_BASE}/feeding/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  execute: (id: number) =>
    fetchJson<FeedingSchedule>(`${API_BASE}/feeding/${id}/execute`, {
      method: 'POST'
    }),
  toggle: (id: number) =>
    fetchJson<FeedingSchedule>(`${API_BASE}/feeding/${id}/toggle`, {
      method: 'PATCH'
    }),
  delete: (id: number) =>
    fetchJson(`${API_BASE}/feeding/${id}`, { method: 'DELETE' })
};

export const alertApi = {
  getAll: (presetId?: number, includeResolved = false) => 
    fetchJson<Alert[]>(
      `${API_BASE}/alerts${presetId ? `?presetId=${presetId}` : ''}${includeResolved ? '&includeResolved=true' : ''}`
    ),
  getById: (id: number) => fetchJson<Alert>(`${API_BASE}/alerts/${id}`),
  create: (data: Partial<Alert>) =>
    fetchJson<Alert>(`${API_BASE}/alerts`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  resolve: (id: number) =>
    fetchJson<Alert>(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'PATCH'
    }),
  delete: (id: number) =>
    fetchJson(`${API_BASE}/alerts/${id}`, { method: 'DELETE' })
};
