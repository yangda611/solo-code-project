import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import type { Gallery, GalleryLayout, LightConfig, TourPath, Exhibit, ExhibitionVersion } from '../database/schema';

export const galleryService = {
  getAll(): Gallery[] {
    const rows = db.prepare('SELECT * FROM galleries').all();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      presetType: row.preset_type,
      width: row.width,
      depth: row.depth,
      height: row.height,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  getById(id: string): Gallery | undefined {
    const row = db.prepare('SELECT * FROM galleries WHERE id = ?').get(id);
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      presetType: row.preset_type,
      width: row.width,
      depth: row.depth,
      height: row.height,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  create(data: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>): Gallery {
    const id = uuidv4();
    const now = Date.now();
    const gallery: Gallery = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    
    db.prepare(`
      INSERT INTO galleries (id, name, description, preset_type, width, depth, height, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      gallery.id,
      gallery.name,
      gallery.description,
      gallery.presetType,
      gallery.width,
      gallery.depth,
      gallery.height,
      gallery.createdAt,
      gallery.updatedAt
    );

    return gallery;
  },

  update(id: string, data: Partial<Omit<Gallery, 'id' | 'createdAt'>>): Gallery | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updated: Gallery = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    };

    db.prepare(`
      UPDATE galleries 
      SET name = ?, description = ?, preset_type = ?, width = ?, depth = ?, height = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.description,
      updated.presetType,
      updated.width,
      updated.depth,
      updated.height,
      updated.updatedAt,
      id
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = db.prepare('DELETE FROM galleries WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getLayout(galleryId: string): GalleryLayout[] {
    const rows = db.prepare('SELECT * FROM gallery_layouts WHERE gallery_id = ?').all(galleryId);
    return rows.map(row => ({
      id: row.id,
      galleryId: row.gallery_id,
      exhibitId: row.exhibit_id,
      position: JSON.parse(row.position),
      rotation: JSON.parse(row.rotation),
      scale: JSON.parse(row.scale),
      createdAt: row.created_at,
    }));
  },

  addLayoutItem(galleryId: string, item: Omit<GalleryLayout, 'id' | 'galleryId' | 'createdAt'>): GalleryLayout {
    const id = uuidv4();
    const now = Date.now();
    const layout: GalleryLayout = {
      id,
      galleryId,
      ...item,
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO gallery_layouts (id, gallery_id, exhibit_id, position, rotation, scale, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      layout.id,
      layout.galleryId,
      layout.exhibitId,
      JSON.stringify(layout.position),
      JSON.stringify(layout.rotation),
      JSON.stringify(layout.scale),
      layout.createdAt
    );

    return layout;
  },

  updateLayoutItem(id: string, data: Partial<Omit<GalleryLayout, 'id' | 'galleryId' | 'createdAt'>>): GalleryLayout | undefined {
    const row = db.prepare('SELECT * FROM gallery_layouts WHERE id = ?').get(id);
    if (!row) return undefined;

    const updated: GalleryLayout = {
      id: row.id,
      galleryId: row.gallery_id,
      exhibitId: data.exhibitId ?? row.exhibit_id,
      position: data.position ?? JSON.parse(row.position),
      rotation: data.rotation ?? JSON.parse(row.rotation),
      scale: data.scale ?? JSON.parse(row.scale),
      createdAt: row.created_at,
    };

    db.prepare(`
      UPDATE gallery_layouts 
      SET exhibit_id = ?, position = ?, rotation = ?, scale = ?
      WHERE id = ?
    `).run(
      updated.exhibitId,
      JSON.stringify(updated.position),
      JSON.stringify(updated.rotation),
      JSON.stringify(updated.scale),
      id
    );

    return updated;
  },

  removeLayoutItem(id: string): boolean {
    const result = db.prepare('DELETE FROM gallery_layouts WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getLights(galleryId: string): LightConfig[] {
    const rows = db.prepare('SELECT * FROM light_configs WHERE gallery_id = ?').all(galleryId);
    return rows.map(row => ({
      id: row.id,
      galleryId: row.gallery_id,
      type: row.type,
      name: row.name,
      color: row.color,
      intensity: row.intensity,
      position: JSON.parse(row.position),
      rotation: JSON.parse(row.rotation),
      targetPosition: row.target_position ? JSON.parse(row.target_position) : undefined,
      distance: row.distance,
      angle: row.angle,
      penumbra: row.penumbra,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  addLight(galleryId: string, light: Omit<LightConfig, 'id' | 'galleryId' | 'createdAt' | 'updatedAt'>): LightConfig {
    const id = uuidv4();
    const now = Date.now();
    const config: LightConfig = {
      id,
      galleryId,
      ...light,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO light_configs (id, gallery_id, type, name, color, intensity, position, rotation, target_position, distance, angle, penumbra, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      config.id,
      config.galleryId,
      config.type,
      config.name,
      config.color,
      config.intensity,
      JSON.stringify(config.position),
      JSON.stringify(config.rotation),
      config.targetPosition ? JSON.stringify(config.targetPosition) : null,
      config.distance,
      config.angle,
      config.penumbra,
      config.createdAt,
      config.updatedAt
    );

    return config;
  },

  updateLight(id: string, data: Partial<Omit<LightConfig, 'id' | 'galleryId' | 'createdAt'>>): LightConfig | undefined {
    const row = db.prepare('SELECT * FROM light_configs WHERE id = ?').get(id);
    if (!row) return undefined;

    const updated: LightConfig = {
      id: row.id,
      galleryId: row.gallery_id,
      type: data.type ?? row.type,
      name: data.name ?? row.name,
      color: data.color ?? row.color,
      intensity: data.intensity ?? row.intensity,
      position: data.position ?? JSON.parse(row.position),
      rotation: data.rotation ?? JSON.parse(row.rotation),
      targetPosition: data.targetPosition ?? (row.target_position ? JSON.parse(row.target_position) : undefined),
      distance: data.distance ?? row.distance,
      angle: data.angle ?? row.angle,
      penumbra: data.penumbra ?? row.penumbra,
      createdAt: row.created_at,
      updatedAt: Date.now(),
    };

    db.prepare(`
      UPDATE light_configs 
      SET type = ?, name = ?, color = ?, intensity = ?, position = ?, rotation = ?, target_position = ?, distance = ?, angle = ?, penumbra = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.type,
      updated.name,
      updated.color,
      updated.intensity,
      JSON.stringify(updated.position),
      JSON.stringify(updated.rotation),
      updated.targetPosition ? JSON.stringify(updated.targetPosition) : null,
      updated.distance,
      updated.angle,
      updated.penumbra,
      updated.updatedAt,
      id
    );

    return updated;
  },

  removeLight(id: string): boolean {
    const result = db.prepare('DELETE FROM light_configs WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getTourPaths(galleryId: string): TourPath[] {
    const rows = db.prepare('SELECT * FROM tour_paths WHERE gallery_id = ?').all(galleryId);
    return rows.map(row => ({
      id: row.id,
      galleryId: row.gallery_id,
      name: row.name,
      points: JSON.parse(row.points),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  addTourPath(galleryId: string, tour: Omit<TourPath, 'id' | 'galleryId' | 'createdAt' | 'updatedAt'>): TourPath {
    const id = uuidv4();
    const now = Date.now();
    const path: TourPath = {
      id,
      galleryId,
      ...tour,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO tour_paths (id, gallery_id, name, points, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      path.id,
      path.galleryId,
      path.name,
      JSON.stringify(path.points),
      path.createdAt,
      path.updatedAt
    );

    return path;
  },

  updateTourPath(id: string, data: Partial<Omit<TourPath, 'id' | 'galleryId' | 'createdAt'>>): TourPath | undefined {
    const row = db.prepare('SELECT * FROM tour_paths WHERE id = ?').get(id);
    if (!row) return undefined;

    const updated: TourPath = {
      id: row.id,
      galleryId: row.gallery_id,
      name: data.name ?? row.name,
      points: data.points ?? JSON.parse(row.points),
      createdAt: row.created_at,
      updatedAt: Date.now(),
    };

    db.prepare(`
      UPDATE tour_paths 
      SET name = ?, points = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.name,
      JSON.stringify(updated.points),
      updated.updatedAt,
      id
    );

    return updated;
  },

  removeTourPath(id: string): boolean {
    const result = db.prepare('DELETE FROM tour_paths WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getVersions(galleryId: string): ExhibitionVersion[] {
    const rows = db.prepare('SELECT * FROM exhibition_versions WHERE gallery_id = ? ORDER BY version DESC').all(galleryId);
    return rows.map(row => ({
      id: row.id,
      galleryId: row.gallery_id,
      version: row.version,
      name: row.name,
      description: row.description,
      layoutSnapshot: JSON.parse(row.layout_snapshot),
      lightsSnapshot: JSON.parse(row.lights_snapshot),
      tourPathsSnapshot: JSON.parse(row.tour_paths_snapshot),
      createdAt: row.created_at,
    }));
  },

  createVersion(galleryId: string, name: string, description: string): ExhibitionVersion {
    const id = uuidv4();
    const now = Date.now();
    
    const existingVersions = this.getVersions(galleryId);
    const version = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;
    
    const layoutSnapshot = this.getLayout(galleryId);
    const lightsSnapshot = this.getLights(galleryId);
    const tourPathsSnapshot = this.getTourPaths(galleryId);

    const exhibitionVersion: ExhibitionVersion = {
      id,
      galleryId,
      version,
      name,
      description,
      layoutSnapshot,
      lightsSnapshot,
      tourPathsSnapshot,
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO exhibition_versions (id, gallery_id, version, name, description, layout_snapshot, lights_snapshot, tour_paths_snapshot, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      exhibitionVersion.id,
      exhibitionVersion.galleryId,
      exhibitionVersion.version,
      exhibitionVersion.name,
      exhibitionVersion.description,
      JSON.stringify(exhibitionVersion.layoutSnapshot),
      JSON.stringify(exhibitionVersion.lightsSnapshot),
      JSON.stringify(exhibitionVersion.tourPathsSnapshot),
      exhibitionVersion.createdAt
    );

    return exhibitionVersion;
  },

  loadVersion(versionId: string): boolean {
    const row = db.prepare('SELECT * FROM exhibition_versions WHERE id = ?').get(versionId);
    if (!row) return false;

    const galleryId = row.gallery_id;
    const layoutSnapshot: GalleryLayout[] = JSON.parse(row.layout_snapshot);
    const lightsSnapshot: LightConfig[] = JSON.parse(row.lights_snapshot);
    const tourPathsSnapshot: TourPath[] = JSON.parse(row.tour_paths_snapshot);

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM gallery_layouts WHERE gallery_id = ?').run(galleryId);
      db.prepare('DELETE FROM light_configs WHERE gallery_id = ?').run(galleryId);
      db.prepare('DELETE FROM tour_paths WHERE gallery_id = ?').run(galleryId);

      for (const item of layoutSnapshot) {
        const newId = uuidv4();
        db.prepare(`
          INSERT INTO gallery_layouts (id, gallery_id, exhibit_id, position, rotation, scale, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          newId,
          galleryId,
          item.exhibitId,
          JSON.stringify(item.position),
          JSON.stringify(item.rotation),
          JSON.stringify(item.scale),
          Date.now()
        );
      }

      for (const light of lightsSnapshot) {
        const newId = uuidv4();
        const now = Date.now();
        db.prepare(`
          INSERT INTO light_configs (id, gallery_id, type, name, color, intensity, position, rotation, target_position, distance, angle, penumbra, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          newId,
          galleryId,
          light.type,
          light.name,
          light.color,
          light.intensity,
          JSON.stringify(light.position),
          JSON.stringify(light.rotation),
          light.targetPosition ? JSON.stringify(light.targetPosition) : null,
          light.distance,
          light.angle,
          light.penumbra,
          now,
          now
        );
      }

      for (const tour of tourPathsSnapshot) {
        const newId = uuidv4();
        const now = Date.now();
        db.prepare(`
          INSERT INTO tour_paths (id, gallery_id, name, points, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          newId,
          galleryId,
          tour.name,
          JSON.stringify(tour.points),
          now,
          now
        );
      }
    });

    tx();
    return true;
  },
};
