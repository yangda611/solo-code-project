import type { FastifyInstance } from 'fastify';
import { exhibitService } from '../services/exhibitService';

export async function exhibitsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/exhibits', async () => {
    const exhibits = exhibitService.getAll();
    return { success: true, data: exhibits };
  });

  fastify.get('/api/exhibits/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const exhibit = exhibitService.getById(id);
    
    if (!exhibit) {
      return reply.code(404).send({ success: false, error: 'Exhibit not found' });
    }
    
    return { success: true, data: exhibit };
  });

  fastify.post('/api/exhibits', async (request) => {
    const body = request.body as Record<string, unknown>;
    const exhibit = exhibitService.create({
      name: body.name as string,
      type: body.type as 'sculpture' | 'painting' | 'display_case',
      description: (body.description as string) || '',
      modelPath: body.modelPath as string | undefined,
      texturePath: body.texturePath as string | undefined,
      metadata: (body.metadata as Record<string, unknown>) || {},
    });
    return { success: true, data: exhibit };
  });

  fastify.put('/api/exhibits/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    
    const exhibit = exhibitService.update(id, {
      name: body.name as string,
      type: body.type as 'sculpture' | 'painting' | 'display_case',
      description: body.description as string,
      modelPath: body.modelPath as string | undefined,
      texturePath: body.texturePath as string | undefined,
      metadata: body.metadata as Record<string, unknown>,
    });
    
    if (!exhibit) {
      return reply.code(404).send({ success: false, error: 'Exhibit not found' });
    }
    
    return { success: true, data: exhibit };
  });

  fastify.delete('/api/exhibits/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = exhibitService.delete(id);
    
    if (!deleted) {
      return reply.code(404).send({ success: false, error: 'Exhibit not found' });
    }
    
    return { success: true };
  });
}
