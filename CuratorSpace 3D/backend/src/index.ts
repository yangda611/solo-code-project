import fastify from 'fastify';
import cors from '@fastify/cors';
import { runMigrations } from './database/migrations';
import { presetService } from './services/presetService';
import { galleriesRoutes } from './routes/galleries';
import { exhibitsRoutes } from './routes/exhibits';

const app = fastify({ logger: true });

async function main(): Promise<void> {
  try {
    await app.register(cors, {
      origin: true,
      credentials: true,
    });

    runMigrations();
    presetService.loadAllPresets();

    await app.register(galleriesRoutes);
    await app.register(exhibitsRoutes);

    const port = parseInt(process.env.PORT || '3001', 10);
    await app.listen({ port, host: '0.0.0.0' });
    
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
