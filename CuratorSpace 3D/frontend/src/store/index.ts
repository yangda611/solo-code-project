import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState } from './types';
import { galleryApi, exhibitApi } from '@/services/api';

type AppStore = AppState & {
  setCurrentGallery: (id: string | null) => void;
  loadGalleries: () => Promise<void>;
  loadExhibits: () => Promise<void>;
  loadGalleryData: (galleryId: string) => Promise<void>;
  loadPresets: () => Promise<void>;
  loadPreset: (type: string) => Promise<void>;
  setSelectedItem: (id: string | null) => void;
  setPlayingTour: (isPlaying: boolean) => void;
  setCurrentTourIndex: (index: number) => void;
  setActiveAnimation: (animation: AppState['activeAnimation']) => void;
  addLayoutItem: (item: Parameters<typeof galleryApi.addLayoutItem>[1]) => Promise<void>;
  updateLayoutItem: (layoutId: string, data: Parameters<typeof galleryApi.updateLayoutItem>[1]) => Promise<void>;
  removeLayoutItem: (layoutId: string) => Promise<void>;
  addLight: (light: Parameters<typeof galleryApi.addLight>[1]) => Promise<void>;
  updateLight: (lightId: string, data: Parameters<typeof galleryApi.updateLight>[1]) => Promise<void>;
  removeLight: (lightId: string) => Promise<void>;
  addTourPath: (tour: Parameters<typeof galleryApi.addTourPath>[1]) => Promise<void>;
  updateTourPath: (tourId: string, data: Parameters<typeof galleryApi.updateTourPath>[1]) => Promise<void>;
  removeTourPath: (tourId: string) => Promise<void>;
  createVersion: (name: string, description?: string) => Promise<void>;
  loadVersion: (versionId: string) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentGalleryId: null,
      galleries: [],
      exhibits: [],
      layout: [],
      lights: [],
      tourPaths: [],
      versions: [],
      presets: [],
      selectedItemId: null,
      isPlayingTour: false,
      currentTourIndex: 0,
      activeAnimation: 'none',
      isLoading: false,
      error: null,

      setCurrentGallery: (id: string | null) => {
        set({ currentGalleryId: id });
        if (id) {
          get().loadGalleryData(id);
        }
      },

      loadGalleries: async () => {
        set({ isLoading: true, error: null });
        try {
          const galleries = await galleryApi.getAll();
          set({ galleries, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load galleries', isLoading: false });
        }
      },

      loadExhibits: async () => {
        set({ isLoading: true, error: null });
        try {
          const exhibits = await exhibitApi.getAll();
          set({ exhibits, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load exhibits', isLoading: false });
        }
      },

      loadGalleryData: async (galleryId: string) => {
        set({ isLoading: true, error: null });
        try {
          const [layout, lights, tourPaths, versions] = await Promise.all([
            galleryApi.getLayout(galleryId),
            galleryApi.getLights(galleryId),
            galleryApi.getTourPaths(galleryId),
            galleryApi.getVersions(galleryId),
          ]);
          set({
            layout,
            lights,
            tourPaths,
            versions,
            isLoading: false,
          });
        } catch (error) {
          set({ error: 'Failed to load gallery data', isLoading: false });
        }
      },

      loadPresets: async () => {
        set({ isLoading: true, error: null });
        try {
          const presets = await galleryApi.getPresets();
          set({ presets, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load presets', isLoading: false });
        }
      },

      loadPreset: async (type: string) => {
        set({ isLoading: true, error: null, activeAnimation: 'transition' });
        try {
          const result = await galleryApi.loadPreset(type);
          await get().loadGalleries();
          await get().loadExhibits();
          set({ 
            currentGalleryId: result.gallery.id,
            activeAnimation: 'none',
            isLoading: false 
          });
          await get().loadGalleryData(result.gallery.id);
        } catch (error) {
          set({ error: 'Failed to load preset', isLoading: false, activeAnimation: 'none' });
        }
      },

      setSelectedItem: (id: string | null) => {
        set({ selectedItemId: id });
      },

      setPlayingTour: (isPlaying: boolean) => {
        set({ isPlayingTour, activeAnimation: isPlaying ? 'flythrough' : 'none' });
      },

      setCurrentTourIndex: (index: number) => {
        set({ currentTourIndex: index });
      },

      setActiveAnimation: (animation: AppState['activeAnimation']) => {
        set({ activeAnimation: animation });
      },

      addLayoutItem: async (item) => {
        const { currentGalleryId } = get();
        if (!currentGalleryId) return;
        
        set({ isLoading: true, error: null, activeAnimation: 'drag' });
        try {
          const newItem = await galleryApi.addLayoutItem(currentGalleryId, item);
          set((state) => ({ 
            layout: [...state.layout, newItem],
            isLoading: false,
            activeAnimation: 'none'
          }));
        } catch (error) {
          set({ error: 'Failed to add layout item', isLoading: false, activeAnimation: 'none' });
        }
      },

      updateLayoutItem: async (layoutId, data) => {
        set({ isLoading: true, error: null, activeAnimation: 'drag' });
        try {
          const updated = await galleryApi.updateLayoutItem(layoutId, data);
          set((state) => ({
            layout: state.layout.map((item) =>
              item.id === layoutId ? updated : item
            ),
            isLoading: false,
            activeAnimation: 'none'
          }));
        } catch (error) {
          set({ error: 'Failed to update layout item', isLoading: false, activeAnimation: 'none' });
        }
      },

      removeLayoutItem: async (layoutId) => {
        set({ isLoading: true, error: null });
        try {
          await galleryApi.removeLayoutItem(layoutId);
          set((state) => ({
            layout: state.layout.filter((item) => item.id !== layoutId),
            selectedItemId: state.selectedItemId === layoutId ? null : state.selectedItemId,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to remove layout item', isLoading: false });
        }
      },

      addLight: async (light) => {
        const { currentGalleryId } = get();
        if (!currentGalleryId) return;
        
        set({ isLoading: true, error: null, activeAnimation: 'light' });
        try {
          const newLight = await galleryApi.addLight(currentGalleryId, light);
          set((state) => ({ 
            lights: [...state.lights, newLight],
            isLoading: false,
            activeAnimation: 'none'
          }));
        } catch (error) {
          set({ error: 'Failed to add light', isLoading: false, activeAnimation: 'none' });
        }
      },

      updateLight: async (lightId, data) => {
        set({ isLoading: true, error: null, activeAnimation: 'light' });
        try {
          const updated = await galleryApi.updateLight(lightId, data);
          set((state) => ({
            lights: state.lights.map((light) =>
              light.id === lightId ? updated : light
            ),
            isLoading: false,
            activeAnimation: 'none'
          }));
        } catch (error) {
          set({ error: 'Failed to update light', isLoading: false, activeAnimation: 'none' });
        }
      },

      removeLight: async (lightId) => {
        set({ isLoading: true, error: null });
        try {
          await galleryApi.removeLight(lightId);
          set((state) => ({
            lights: state.lights.filter((light) => light.id !== lightId),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to remove light', isLoading: false });
        }
      },

      addTourPath: async (tour) => {
        const { currentGalleryId } = get();
        if (!currentGalleryId) return;
        
        set({ isLoading: true, error: null });
        try {
          const newTour = await galleryApi.addTourPath(currentGalleryId, tour);
          set((state) => ({ 
            tourPaths: [...state.tourPaths, newTour],
            isLoading: false 
          }));
        } catch (error) {
          set({ error: 'Failed to add tour path', isLoading: false });
        }
      },

      updateTourPath: async (tourId, data) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await galleryApi.updateTourPath(tourId, data);
          set((state) => ({
            tourPaths: state.tourPaths.map((tour) =>
              tour.id === tourId ? updated : tour
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to update tour path', isLoading: false });
        }
      },

      removeTourPath: async (tourId) => {
        set({ isLoading: true, error: null });
        try {
          await galleryApi.removeTourPath(tourId);
          set((state) => ({
            tourPaths: state.tourPaths.filter((tour) => tour.id !== tourId),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to remove tour path', isLoading: false });
        }
      },

      createVersion: async (name, description) => {
        const { currentGalleryId } = get();
        if (!currentGalleryId) return;
        
        set({ isLoading: true, error: null });
        try {
          const version = await galleryApi.createVersion(currentGalleryId, { name, description });
          set((state) => ({ 
            versions: [...state.versions, version],
            isLoading: false 
          }));
        } catch (error) {
          set({ error: 'Failed to create version', isLoading: false });
        }
      },

      loadVersion: async (versionId) => {
        const { currentGalleryId } = get();
        if (!currentGalleryId) return;
        
        set({ isLoading: true, error: null, activeAnimation: 'transition' });
        try {
          await galleryApi.loadVersion(versionId);
          await get().loadGalleryData(currentGalleryId);
          set({ isLoading: false, activeAnimation: 'none' });
        } catch (error) {
          set({ error: 'Failed to load version', isLoading: false, activeAnimation: 'none' });
        }
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'curator-space-storage',
      partialize: (state) => ({
        currentGalleryId: state.currentGalleryId,
      }),
    }
  )
);
