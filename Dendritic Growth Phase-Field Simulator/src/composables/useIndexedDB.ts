import { ref } from 'vue'
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SimulationParams, SimulationState } from '../types/simulation'

interface SimulationDB extends DBSchema {
  states: {
    key: string
    value: SimulationState
    indexes: { 'by-timestamp': number }
  }
  presets: {
    key: string
    value: { id: string; name: string; params: SimulationParams }
  }
}

const dbInstance = ref<IDBPDatabase<SimulationDB> | null>(null)

export function useIndexedDB() {
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  async function initDB() {
    if (dbInstance.value) return dbInstance.value

    try {
      const db = await openDB<SimulationDB>('dendritic-simulation-db', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('states')) {
            const stateStore = db.createObjectStore('states', { keyPath: 'id' })
            stateStore.createIndex('by-timestamp', 'timestamp')
          }
          if (!db.objectStoreNames.contains('presets')) {
            db.createObjectStore('presets', { keyPath: 'id' })
          }
        }
      })
      dbInstance.value = db
      isInitialized.value = true
      return db
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  async function saveState(state: Omit<SimulationState, 'id' | 'timestamp'>) {
    const db = await initDB()
    const id = `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const fullState: SimulationState = {
      ...state,
      id,
      timestamp: Date.now()
    }
    await db.put('states', fullState)
    return id
  }

  async function loadState(id: string): Promise<SimulationState | undefined> {
    const db = await initDB()
    return db.get('states', id)
  }

  async function getAllStates(): Promise<SimulationState[]> {
    const db = await initDB()
    return db.getAllFromIndex('states', 'by-timestamp')
  }

  async function deleteState(id: string) {
    const db = await initDB()
    await db.delete('states', id)
  }

  async function clearAllStates() {
    const db = await initDB()
    await db.clear('states')
  }

  async function savePreset(id: string, name: string, params: SimulationParams) {
    const db = await initDB()
    await db.put('presets', { id, name, params })
  }

  async function loadPreset(id: string) {
    const db = await initDB()
    return db.get('presets', id)
  }

  async function getAllPresets() {
    const db = await initDB()
    return db.getAll('presets')
  }

  return {
    isInitialized,
    error,
    initDB,
    saveState,
    loadState,
    getAllStates,
    deleteState,
    clearAllStates,
    savePreset,
    loadPreset,
    getAllPresets
  }
}
