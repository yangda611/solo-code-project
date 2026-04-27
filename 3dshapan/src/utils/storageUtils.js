const STORAGE_KEY = 'terrain-editor-data';
const STORAGE_VERSION = '1.0';

export function saveTerrainData(heights, water, terrainMode, timeOfDay) {
  try {
    const data = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      heights: Array.from(heights),
      water: Array.from(water),
      terrainMode,
      timeOfDay
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save terrain data:', error);
    return false;
  }
}

export function loadTerrainData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    
    if (data.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, discarding old data');
      return null;
    }
    
    return {
      heights: new Float32Array(data.heights),
      water: new Float32Array(data.water),
      terrainMode: data.terrainMode || 'hills',
      timeOfDay: data.timeOfDay || 'day'
    };
  } catch (error) {
    console.error('Failed to load terrain data:', error);
    return null;
  }
}

export function clearTerrainData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear terrain data:', error);
    return false;
  }
}

export function hasSavedData() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
