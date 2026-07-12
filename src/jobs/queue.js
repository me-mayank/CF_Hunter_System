import { Queue, Worker } from 'bullmq';
import { config } from '../config/index.js';
import { processRegisterJob } from './registerHunter.job.js';
import { processRefreshJob } from './refreshHunter.job.js';

export const JOB_QUEUES = {
  HUNTER_JOBS: 'hunter-jobs'
};

const connection = {
  url: config.redisUrl
};

// Queue instance for adding jobs (mocked in test)
export const hunterQueue = process.env.NODE_ENV === 'test' 
  ? { add: async () => ({ id: 'mock-job-id' }) }
  : new Queue(JOB_QUEUES.HUNTER_JOBS, { connection });

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
