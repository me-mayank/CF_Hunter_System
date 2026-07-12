import { config } from './config/index.js';
import { createServer } from './api/server.js';
import { connectDB, disconnectDB } from './db/connection.js';
import { startWorker, stopWorker } from './jobs/queue.js';
import { startScheduler } from './jobs/scheduler.js';

async function bootstrap() {
  try {
    await connectDB();
    startWorker();
    startScheduler();
    
    const app = createServer();
    const server = app.listen(config.port, () => {
      console.log(`Hunter Engine backend listening on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      server.close();
      await stopWorker();
      await disconnectDB();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
