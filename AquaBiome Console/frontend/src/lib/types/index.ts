export interface Preset {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Fish {
  id: number;
  preset_id: number;
  species: string;
  name?: string;
  quantity: number;
  health_status: 'healthy' | 'stressed' | 'sick' | 'dying';
  behavior?: string;
  last_fed?: string;
  created_at: string;
  updated_at: string;
}

export interface Coral {
  id: number;
  preset_id: number;
  species: string;
  name?: string;
  health_status: 'healthy' | 'stressed' | 'sick' | 'dying';
  position?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: number;
  preset_id: number;
  type: 'filter' | 'air_pump' | 'heater' | 'light';
  name: string;
  status: 'running' | 'stopped' | 'malfunction';
  power: number;
  last_maintenance?: string;
  created_at: string;
  updated_at: string;
}

export interface WaterParameters {
  id: number;
  preset_id: number;
  temperature: number;
  ph: number;
  ammonia: number;
  nitrite: number;
  nitrate: number;
  oxygen: number;
  salinity: number;
  clarity: number;
  algae_level: number;
  recorded_at: string;
  created_at: string;
}

export interface LightingSchedule {
  id: number;
  preset_id: number;
  name: string;
  start_time: string;
  end_time: string;
  intensity: number;
  color_temperature: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedingSchedule {
  id: number;
  preset_id: number;
  name: string;
  time: string;
  amount: number;
  food_type: string;
  is_active: boolean;
  last_executed?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  preset_id: number;
  type: 'oxygen' | 'water' | 'device' | 'algae';
  severity: 'warning' | 'critical';
  message: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface DeviceLog {
  id: number;
  device_id: number;
  event_type: string;
  details?: string;
  created_at: string;
}

export interface FullState {
  preset: Preset;
  fish: Fish[];
  corals: Coral[];
  devices: Device[];
  waterParams: WaterParameters;
  lighting: LightingSchedule[];
  feeding: FeedingSchedule[];
  alerts: Alert[];
  lastUpdated: string;
}

export interface SceneConfig {
  waterClarity: number;
  waterColor: { r: number; g: number; b: number };
  algaeLevel: number;
  oxygenLevel: number;
  lightingIntensity: number;
  deviceStatuses: {
    filter: 'running' | 'stopped' | 'malfunction';
    airPump: 'running' | 'stopped' | 'malfunction';
    heater: 'running' | 'stopped' | 'malfunction';
    light: 'running' | 'stopped' | 'malfunction';
  };
}
