import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = await createServer({
  configFile: path.join(__dirname, 'vite.config.ts'),
  server: {
    port: 3000
  }
});

await server.listen();
server.printUrls();
