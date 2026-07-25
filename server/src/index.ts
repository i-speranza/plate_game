import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers.js';
import { SessionStore } from './sessionStore.js';
import { dictionaryService } from './dictionaryService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const clientDist = join(__dirname, '../../client/dist');

async function main() {
  dictionaryService.load();
  console.log(`Dictionaries loaded: IT=${dictionaryService.size('it')}, EN=${dictionaryService.size('en')}`);

  const fastify = Fastify({ logger: false });
  await fastify.register(cors, { origin: true });

  fastify.get('/health', async () => ({
    ok: true,
    dictionaries: {
      it: dictionaryService.size('it'),
      en: dictionaryService.size('en'),
    },
  }));

  if (existsSync(clientDist)) {
    await fastify.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
    });

    fastify.setNotFoundHandler((request, reply) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        reply.code(404).send({ error: 'Not found' });
        return;
      }
      if (request.url.startsWith('/socket.io')) {
        reply.code(404).send({ error: 'Not found' });
        return;
      }
      reply.sendFile('index.html');
    });

    console.log(`Serving client from ${clientDist}`);
  }

  await fastify.listen({ port: PORT, host: '0.0.0.0' });

  const io = new Server(fastify.server, {
    cors: { origin: true },
    transports: ['websocket', 'polling'],
  });

  const store = new SessionStore();
  registerSocketHandlers(io, store);

  console.log(`Plate Game server running on http://localhost:${PORT}`);

  const shutdown = () => {
    store.destroy();
    io.close();
    fastify.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
