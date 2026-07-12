import cron from 'node-cron';
import { getOutdatedHunters } from '../db/repositories/hunter.repository.js';
import { createJob, getActiveJobByHandle } from '../db/repositories/hunterJob.repository.js';
import { hunterQueue, JOB_QUEUES } from './queue.js';
import { v4 as uuidv4 } from 'uuid';

export function startScheduler() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled sweep for outdated hunters...');
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const outdated = await getOutdatedHunters(twentyFourHoursAgo);

      for (const hunter of outdated) {
        const handle = hunter.handle;
        
        // Prevent duplicate jobs
        const active = await getActiveJobByHandle(handle);
        if (active) continue;

        const jobId = uuidv4();
        await createJob({ _id: jobId, handle: handle.toLowerCase(), type: 'REFRESH' });
        await hunterQueue.add(JOB_QUEUES.HUNTER_JOBS, { type: 'REFRESH', handle: handle.toLowerCase(), jobId }, { jobId });
        console.log(`Scheduled refresh job for ${handle}`);
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });
}
