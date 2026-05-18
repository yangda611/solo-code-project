import { ref, onMounted } from 'vue';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Conformation, FoldingTrajectory, SimulationParams } from '~/types/hp-model';

interface ProteinFoldingDB extends DBSchema {
  conformations: {
    key: string;
    value: Conformation;
    indexes: {
      'by-energy': number;
      'by-step': number;
      'by-temperature': number;
    };
  };
  trajectories: {
    key: string;
    value: FoldingTrajectory;
    indexes: {
      'by-created': number;
      'by-chain-length': number;
    };
  };
}

const DB_NAME = 'ProteinFoldingDB';
const DB_VERSION = 1;

export const useIndexedDB = () => {
  const db = ref<IDBPDatabase<ProteinFoldingDB> | null>(null);
  const isInitialized = ref(false);

  const initDB = async () => {
    db.value = await openDB<ProteinFoldingDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const conformationsStore = db.createObjectStore('conformations', {
          keyPath: 'id'
        });
        conformationsStore.createIndex('by-energy', 'energy');
        conformationsStore.createIndex('by-step', 'step');
        conformationsStore.createIndex('by-temperature', 'temperature');

        const trajectoriesStore = db.createObjectStore('trajectories', {
          keyPath: 'id'
        });
        trajectoriesStore.createIndex('by-created', 'createdAt');
        trajectoriesStore.createIndex('by-chain-length', 'params.chainLength');
      }
    });
    isInitialized.value = true;
  };

  const saveConformation = async (conformation: Conformation) => {
    if (!db.value) return;
    await db.value.put('conformations', conformation);
  };

  const getConformation = async (id: string): Promise<Conformation | undefined> => {
    if (!db.value) return undefined;
    return await db.value.get('conformations', id);
  };

  const getLowEnergyConformations = async (limit: number = 10): Promise<Conformation[]> => {
    if (!db.value) return [];
    const tx = db.value.transaction('conformations', 'readonly');
    const index = tx.store.index('by-energy');
    const conformations: Conformation[] = [];

    let cursor = await index.openCursor(null, 'next');
    while (cursor && conformations.length < limit) {
      conformations.push(cursor.value);
      cursor = await cursor.continue();
    }

    await tx.done;
    return conformations;
  };

  const saveTrajectory = async (name: string, params: SimulationParams, conformations: Conformation[]) => {
    if (!db.value) return;
    const trajectory: FoldingTrajectory = {
      id: `traj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      params,
      conformations,
      createdAt: Date.now()
    };
    await db.value.put('trajectories', trajectory);
    return trajectory.id;
  };

  const getTrajectory = async (id: string): Promise<FoldingTrajectory | undefined> => {
    if (!db.value) return undefined;
    return await db.value.get('trajectories', id);
  };

  const getAllTrajectories = async (): Promise<FoldingTrajectory[]> => {
    if (!db.value) return [];
    return await db.value.getAllFromIndex('trajectories', 'by-created', null, 'prev');
  };

  const deleteConformation = async (id: string) => {
    if (!db.value) return;
    await db.value.delete('conformations', id);
  };

  const deleteTrajectory = async (id: string) => {
    if (!db.value) return;
    await db.value.delete('trajectories', id);
  };

  const clearAll = async () => {
    if (!db.value) return;
    const tx = db.value.transaction(['conformations', 'trajectories'], 'readwrite');
    await tx.objectStore('conformations').clear();
    await tx.objectStore('trajectories').clear();
    await tx.done;
  };

  onMounted(() => {
    initDB();
  });

  return {
    isInitialized,
    saveConformation,
    getConformation,
    getLowEnergyConformations,
    saveTrajectory,
    getTrajectory,
    getAllTrajectories,
    deleteConformation,
    deleteTrajectory,
    clearAll
  };
};
