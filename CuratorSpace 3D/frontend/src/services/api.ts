import axios from 'axios';
import type {
  Gallery,
  Exhibit,
  GalleryLayout,
  LightConfig,
  TourPath,
  ExhibitionVersion,
  PresetInfo,
} from '@/store/types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const galleryApi = {
  async getAll(): Promise<Gallery[]> {
    const response = await api.get('/galleries');
    return response.data.data;
  },

  async getById(id: string): Promise<Gallery> {
    const response = await api.get(`/galleries/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Gallery>): Promise<Gallery> {
    const response = await api.post('/galleries', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Gallery>): Promise<Gallery> {
    const response = await api.put(`/galleries/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/galleries/${id}`);
  },

  async getPresets(): Promise<PresetInfo[]> {
    const response = await api.get('/galleries/presets');
    return response.data.data;
  },

  async loadPreset(type: string): Promise<{ gallery: Gallery; exhibits: Exhibit[] }> {
    const response = await api.post(`/galleries/presets/load/${type}`);
    return response.data.data;
  },

  async getLayout(galleryId: string): Promise<GalleryLayout[]> {
    const response = await api.get(`/galleries/${galleryId}/layout`);
    return response.data.data;
  },

  async addLayoutItem(galleryId: string, data: Omit<GalleryLayout, 'id' | 'galleryId' | 'createdAt'>): Promise<GalleryLayout> {
    const response = await api.post(`/galleries/${galleryId}/layout`, data);
    return response.data.data;
  },

  async updateLayoutItem(layoutId: string, data: Partial<Omit<GalleryLayout, 'id' | 'galleryId' | 'createdAt'>>): Promise<GalleryLayout> {
    const response = await api.put(`/galleries/layout/${layoutId}`, data);
    return response.data.data;
  },

  async removeLayoutItem(layoutId: string): Promise<void> {
    await api.delete(`/galleries/layout/${layoutId}`);
  },

  async getLights(galleryId: string): Promise<LightConfig[]> {
    const response = await api.get(`/galleries/${galleryId}/lights`);
    return response.data.data;
  },

  async addLight(galleryId: string, data: Omit<LightConfig, 'id' | 'galleryId' | 'createdAt' | 'updatedAt'>): Promise<LightConfig> {
    const response = await api.post(`/galleries/${galleryId}/lights`, data);
    return response.data.data;
  },

  async updateLight(lightId: string, data: Partial<Omit<LightConfig, 'id' | 'galleryId' | 'createdAt'>>): Promise<LightConfig> {
    const response = await api.put(`/galleries/lights/${lightId}`, data);
    return response.data.data;
  },

  async removeLight(lightId: string): Promise<void> {
    await api.delete(`/galleries/lights/${lightId}`);
  },

  async getTourPaths(galleryId: string): Promise<TourPath[]> {
    const response = await api.get(`/galleries/${galleryId}/tours`);
    return response.data.data;
  },

  async addTourPath(galleryId: string, data: Omit<TourPath, 'id' | 'galleryId' | 'createdAt' | 'updatedAt'>): Promise<TourPath> {
    const response = await api.post(`/galleries/${galleryId}/tours`, data);
    return response.data.data;
  },

  async updateTourPath(tourId: string, data: Partial<Omit<TourPath, 'id' | 'galleryId' | 'createdAt'>>): Promise<TourPath> {
    const response = await api.put(`/galleries/tours/${tourId}`, data);
    return response.data.data;
  },

  async removeTourPath(tourId: string): Promise<void> {
    await api.delete(`/galleries/tours/${tourId}`);
  },

  async getVersions(galleryId: string): Promise<ExhibitionVersion[]> {
    const response = await api.get(`/galleries/${galleryId}/versions`);
    return response.data.data;
  },

  async createVersion(galleryId: string, data: { name: string; description?: string }): Promise<ExhibitionVersion> {
    const response = await api.post(`/galleries/${galleryId}/versions`, data);
    return response.data.data;
  },

  async loadVersion(versionId: string): Promise<void> {
    await api.post(`/galleries/versions/${versionId}/load`);
  },
};

export const exhibitApi = {
  async getAll(): Promise<Exhibit[]> {
    const response = await api.get('/exhibits');
    return response.data.data;
  },

  async getById(id: string): Promise<Exhibit> {
    const response = await api.get(`/exhibits/${id}`);
    return response.data.data;
  },

  async create(data: Omit<Exhibit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exhibit> {
    const response = await api.post('/exhibits', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Omit<Exhibit, 'id' | 'createdAt'>>): Promise<Exhibit> {
    const response = await api.put(`/exhibits/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/exhibits/${id}`);
  },
};
