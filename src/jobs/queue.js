import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/index.js';
import { processRegisterJob } from './registerHunter.job.js';
import { processRefreshJob } from './refreshHunter.job.js';

export const JOB_QUEUES = {
  HUNTER_JOBS: 'hunter-jobs'
};

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  family: 0,
  tls: config.redisUrl && config.redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
});

// Queue instance for adding jobs (mocked in test)
export const hunterQueue = process.env.NODE_ENV === 'test' 
  ? { add: async () => ({ id: 'mock-job-id' }) }
  : new Queue(JOB_QUEUES.HUNTER_JOBS, { 
      connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      }
    });

// Setup Worker
let worker;

export function startWorker() {
  worker = new Worker(JOB_QUEUES.HUNTER_JOBS, async (job) => {
    const { type } = job.data;
    
    if (type === 'REGISTER') {
      return processRegisterJob(job);
    } else if (type === 'REFRESH') {
      return processRefreshJob(job);
    }
    
    throw new Error(`Unknown job type: ${type}`);
  }, {
    connection,
    concurrency: 2, // Be conservative to avoid hitting rate limits
    // ULTRA-OPTIMIZATIONS for Upstash Free Tier (500k commands/month limit):
    // 1. stalledInterval: 300000 (5 minutes) - defaults to 30s. Reduces stalled check scripts.
    // 2. drainDelay: 300000 (5 minutes) - wait 5 mins instead of 5s before re-polling when queue is empty.
    //    New jobs will STILL wake up the worker instantly via Redis Pub/Sub, so this just kills idle polling!
    stalledInterval: 300000,
    drainDelay: 300000,
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
  });
}

export async function stopWorker() {
  if (worker) {
    await worker.close();
  }
}
