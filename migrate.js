import { connectDB, disconnectDB } from './src/db/connection.js';
import { Hunter } from './src/db/models/Hunter.model.js';
import { Queue } from 'bullmq';
import { config } from './src/config/index.js';
import { JOB_QUEUES } from './src/jobs/queue.js';

async function migrate() {
  try {
    await connectDB();
    
    const hunters = await Hunter.find({}, { handle: 1 }).lean();
    console.log(`Found ${hunters.length} hunters in DB.`);
    
    if (hunters.length === 0) {
      console.log('No hunters to update.');
      await disconnectDB();
      return;
    }

    const queue = new Queue(JOB_QUEUES.HUNTER_JOBS, { 
      connection: { url: config.redisUrl } 
    });

    for (const hunter of hunters) {
      const handle = hunter.handle;
      const jobId = `refresh-${handle}-${Date.now()}`;
      
      await queue.add('refresh', {
        type: 'REFRESH',
        handle: handle
      }, {
        jobId,
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 24 * 3600 }
      });
      console.log(`Enqueued REFRESH job for ${handle}`);
    }
    
    console.log('All hunters enqueued for update on queue:', JOB_QUEUES.HUNTER_JOBS);
    await queue.close();
    await disconnectDB();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
