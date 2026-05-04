import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import type { Exhibit } from '../database/schema';

export const exhibitService = {
  getAll(): Exhibit[] {
    const rows = db.prepare('SELECT * FROM exhibits').all();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      modelPath: row.model_path,
      texturePath: row.texture_path,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  getById(id: string): Exhibit | undefined {
    const row = db.prepare('SELECT * FROM exhibits WHERE id = ?').get(id);
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      modelPath: row.model_path,
      texturePath: row.texture_path,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  create(data: Omit<Exhibit, 'id' | 'createdAt' | 'updatedAt'>): Exhibit {
    const id = uuidv4();
    const now = Date.now();
    const exhibit: Exhibit = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO exhibits (id, name, type, description, model_path, texture_path, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      exhibit.id,
      exhibit.name,
      exhibit.type,
      exhibit.description,
      exhibit.modelPath,
      exhibit.texturePath,
      JSON.stringify(exhibit.metadata),
      exhibit.createdAt,
      exhibit.updatedAt
    );

    return exhibit;
  },

  update(id: string, data: Partial<Omit<Exhibit, 'id' | 'createdAt'>>): Exhibit | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updated: Exhibit = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    };

    db.prepare(`
      UPDATE exhibits 
      SET name = ?, type = ?, description = ?, model_path = ?, texture_path = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.type,
      updated.description,
      updated.modelPath,
      updated.texturePath,
      JSON.stringify(updated.metadata),
      updated.updatedAt,
      id
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = db.prepare('DELETE FROM exhibits WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
