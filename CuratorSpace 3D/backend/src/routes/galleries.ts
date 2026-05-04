import type { FastifyInstance } from 'fastify';
import { galleryService } from '../services/galleryService';
import { presetService } from '../services/presetService';

export async function galleriesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/galleries', async () => {
    const galleries = galleryService.getAll();
    return { success: true, data: galleries };
  });

  fastify.get('/api/galleries/presets', async () => {
    const presets = presetService.getAllPresetInfo();
    return { success: true, data: presets };
  });

  fastify.post('/api/galleries/presets/load/:type', async (request, reply) => {
    const { type } = request.params as { type: string };
    const result = presetService.loadPreset(type);
    
    if (!result) {
      return reply.code(404).send({ success: false, error: 'Preset not found' });
    }
    
    return { success: true, data: result };
  });

  fastify.get('/api/galleries/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    return { success: true, data: gallery };
  });

  fastify.post('/api/galleries', async (request) => {
    const body = request.body as Record<string, unknown>;
    const gallery = galleryService.create({
      name: body.name as string,
      description: (body.description as string) || '',
      presetType: body.presetType as 'modern' | 'ancient' | 'overexposed' | 'obstructed' | undefined,
      width: (body.width as number) || 20,
      depth: (body.depth as number) || 20,
      height: (body.height as number) || 5,
    });
    return { success: true, data: gallery };
  });

  fastify.put('/api/galleries/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    
    const gallery = galleryService.update(id, {
      name: body.name as string,
      description: body.description as string,
      presetType: body.presetType as 'modern' | 'ancient' | 'overexposed' | 'obstructed' | undefined,
      width: body.width as number,
      depth: body.depth as number,
      height: body.height as number,
    });
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    return { success: true, data: gallery };
  });

  fastify.delete('/api/galleries/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = galleryService.delete(id);
    
    if (!deleted) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    return { success: true };
  });

  fastify.get('/api/galleries/:id/layout', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const layout = galleryService.getLayout(id);
    return { success: true, data: layout };
  });

  fastify.post('/api/galleries/:id/layout', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const layout = galleryService.addLayoutItem(id, {
      exhibitId: body.exhibitId as string,
      position: body.position as { x: number; y: number; z: number },
      rotation: body.rotation as { x: number; y: number; z: number },
      scale: body.scale as { x: number; y: number; z: number },
    });
    
    return { success: true, data: layout };
  });

  fastify.put('/api/galleries/layout/:layoutId', async (request, reply) => {
    const { layoutId } = request.params as { layoutId: string };
    const body = request.body as Record<string, unknown>;
    
    const layout = galleryService.updateLayoutItem(layoutId, {
      exhibitId: body.exhibitId as string,
      position: body.position as { x: number; y: number; z: number },
      rotation: body.rotation as { x: number; y: number; z: number },
      scale: body.scale as { x: number; y: number; z: number },
    });
    
    if (!layout) {
      return reply.code(404).send({ success: false, error: 'Layout item not found' });
    }
    
    return { success: true, data: layout };
  });

  fastify.delete('/api/galleries/layout/:layoutId', async (request, reply) => {
    const { layoutId } = request.params as { layoutId: string };
    const deleted = galleryService.removeLayoutItem(layoutId);
    
    if (!deleted) {
      return reply.code(404).send({ success: false, error: 'Layout item not found' });
    }
    
    return { success: true };
  });

  fastify.get('/api/galleries/:id/lights', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const lights = galleryService.getLights(id);
    return { success: true, data: lights };
  });

  fastify.post('/api/galleries/:id/lights', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const light = galleryService.addLight(id, {
      type: body.type as 'ambient' | 'directional' | 'point' | 'spot',
      name: body.name as string,
      color: body.color as string,
      intensity: body.intensity as number,
      position: body.position as { x: number; y: number; z: number },
      rotation: body.rotation as { x: number; y: number; z: number },
      targetPosition: body.targetPosition as { x: number; y: number; z: number } | undefined,
      distance: body.distance as number | undefined,
      angle: body.angle as number | undefined,
      penumbra: body.penumbra as number | undefined,
    });
    
    return { success: true, data: light };
  });

  fastify.put('/api/galleries/lights/:lightId', async (request, reply) => {
    const { lightId } = request.params as { lightId: string };
    const body = request.body as Record<string, unknown>;
    
    const light = galleryService.updateLight(lightId, {
      type: body.type as 'ambient' | 'directional' | 'point' | 'spot',
      name: body.name as string,
      color: body.color as string,
      intensity: body.intensity as number,
      position: body.position as { x: number; y: number; z: number },
      rotation: body.rotation as { x: number; y: number; z: number },
      targetPosition: body.targetPosition as { x: number; y: number; z: number } | undefined,
      distance: body.distance as number | undefined,
      angle: body.angle as number | undefined,
      penumbra: body.penumbra as number | undefined,
    });
    
    if (!light) {
      return reply.code(404).send({ success: false, error: 'Light not found' });
    }
    
    return { success: true, data: light };
  });

  fastify.delete('/api/galleries/lights/:lightId', async (request, reply) => {
    const { lightId } = request.params as { lightId: string };
    const deleted = galleryService.removeLight(lightId);
    
    if (!deleted) {
      return reply.code(404).send({ success: false, error: 'Light not found' });
    }
    
    return { success: true };
  });

  fastify.get('/api/galleries/:id/tours', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const tours = galleryService.getTourPaths(id);
    return { success: true, data: tours };
  });

  fastify.post('/api/galleries/:id/tours', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const tour = galleryService.addTourPath(id, {
      name: body.name as string,
      points: body.points as Array<{
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
        waitTime: number;
        focusTarget?: string;
      }>,
    });
    
    return { success: true, data: tour };
  });

  fastify.put('/api/galleries/tours/:tourId', async (request, reply) => {
    const { tourId } = request.params as { tourId: string };
    const body = request.body as Record<string, unknown>;
    
    const tour = galleryService.updateTourPath(tourId, {
      name: body.name as string,
      points: body.points as Array<{
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
        waitTime: number;
        focusTarget?: string;
      }>,
    });
    
    if (!tour) {
      return reply.code(404).send({ success: false, error: 'Tour not found' });
    }
    
    return { success: true, data: tour };
  });

  fastify.delete('/api/galleries/tours/:tourId', async (request, reply) => {
    const { tourId } = request.params as { tourId: string };
    const deleted = galleryService.removeTourPath(tourId);
    
    if (!deleted) {
      return reply.code(404).send({ success: false, error: 'Tour not found' });
    }
    
    return { success: true };
  });

  fastify.get('/api/galleries/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const versions = galleryService.getVersions(id);
    return { success: true, data: versions };
  });

  fastify.post('/api/galleries/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const gallery = galleryService.getById(id);
    
    if (!gallery) {
      return reply.code(404).send({ success: false, error: 'Gallery not found' });
    }
    
    const version = galleryService.createVersion(
      id,
      (body.name as string) || `Version ${Date.now()}`,
      (body.description as string) || ''
    );
    
    return { success: true, data: version };
  });

  fastify.post('/api/galleries/versions/:versionId/load', async (request, reply) => {
    const { versionId } = request.params as { versionId: string };
    const loaded = galleryService.loadVersion(versionId);
    
    if (!loaded) {
      return reply.code(404).send({ success: false, error: 'Version not found' });
    }
    
    return { success: true };
  });
}
