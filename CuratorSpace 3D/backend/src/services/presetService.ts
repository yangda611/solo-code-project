import { galleryService } from './galleryService';
import { exhibitService } from './exhibitService';
import { presetGalleries } from '../data/presets';
import type { Gallery, Exhibit } from '../database/schema';

export const presetService = {
  getAllPresetInfo(): { type: string; name: string; description: string }[] {
    return Object.entries(presetGalleries).map(([type, preset]) => ({
      type,
      name: preset.gallery.name,
      description: preset.gallery.description,
    }));
  },

  loadPreset(presetType: string): { gallery: Gallery; exhibits: Exhibit[] } | null {
    const preset = presetGalleries[presetType];
    if (!preset) return null;

    const gallery = galleryService.create(preset.gallery);

    const createdExhibits: Exhibit[] = [];
    const exhibitIdMap = new Map<number, string>();

    preset.exhibits.forEach((exhibitData, index) => {
      const exhibit = exhibitService.create(exhibitData);
      createdExhibits.push(exhibit);
      exhibitIdMap.set(index, exhibit.id);
    });

    preset.layout.forEach((layoutData) => {
      galleryService.addLayoutItem(gallery.id, layoutData);
    });

    preset.lights.forEach((lightData) => {
      galleryService.addLight(gallery.id, lightData);
    });

    preset.tourPaths.forEach((tourData) => {
      galleryService.addTourPath(gallery.id, tourData);
    });

    return { gallery, exhibits: createdExhibits };
  },

  loadAllPresets(): void {
    const existing = galleryService.getAll();
    const existingPresets = new Set(existing.map(g => g.presetType));

    Object.keys(presetGalleries).forEach((type) => {
      if (!existingPresets.has(type)) {
        this.loadPreset(type);
      }
    });
  },
};
