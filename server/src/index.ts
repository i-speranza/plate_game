import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers.js';
import { SessionStore } from './sessionStore.js';
import { dictionaryService } from './dictionaryService.js';

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  dictionaryService.load();
  console.log(`Dictionaries loaded: IT=${dictionaryService.size('it')}, EN=${dictionaryService.size('en')}`);

  const fastify = Fastify({ logger: false });
  await fastify.register(cors, { origin: true });

  fastify.get('/health', async () => ({ ok: true }));

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
