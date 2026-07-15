import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getHunterByHandle, updateLastManualRefresh } from '../../db/repositories/hunter.repository.js';
import { getActiveJobByHandle, createJob } from '../../db/repositories/hunterJob.repository.js';
import { hunterQueue, JOB_QUEUES } from '../../jobs/queue.js';
import { addClient, removeClient } from '../../realtime/sseHub.js';

const router = Router();

// Helper to enqueue job safely
async function enqueueRegisterJob(handle) {
  const jobId = uuidv4();
  await createJob({ _id: jobId, handle: handle.toLowerCase(), type: 'REGISTER' });
  await hunterQueue.add(JOB_QUEUES.HUNTER_JOBS, { type: 'REGISTER', handle: handle.toLowerCase(), jobId }, { jobId });
  return jobId;
}

async function enqueueRefreshJob(handle) {
  const jobId = uuidv4();
  await createJob({ _id: jobId, handle: handle.toLowerCase(), type: 'REFRESH' });
  await hunterQueue.add(JOB_QUEUES.HUNTER_JOBS, { type: 'REFRESH', handle: handle.toLowerCase(), jobId }, { jobId });
  return jobId;
}

router.get('/hunter/:handle', async (req, res, next) => {
  try {
    const { handle } = req.params;
    const profile = await getHunterByHandle(handle);

    if (profile) {
      return res.json(profile);
    }

    const activeJob = await getActiveJobByHandle(handle);
    if (activeJob) {
      return res.status(202).json({
        status: 'PROCESSING',
        jobId: activeJob._id,
        stage: activeJob.stage,
        estimatedTime: 30
      });
    }

    // No profile, no job -> enqueue REGISTER
    const jobId = await enqueueRegisterJob(handle);
    return res.status(202).json({
      status: 'PROCESSING',
      jobId,
      estimatedTime: 30
    });
  } catch (err) {
    next(err);
  }
});

router.get('/hunter/:handle/status', async (req, res, next) => {
  try {
    const { handle } = req.params;
    
    // Check if we have an active job first
    const activeJob = await getActiveJobByHandle(handle);
    if (activeJob) {
      return res.json({
        status: 'PROCESSING',
        jobId: activeJob._id,
        stage: activeJob.stage
      });
    }

    // Then check if we have a profile
    const profile = await getHunterByHandle(handle);
    if (profile) {
      return res.json({ status: 'READY' });
    }

    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hunter not found' } });
  } catch (err) {
    next(err);
  }
});

router.post('/hunter/:handle/refresh', async (req, res, next) => {
  try {
    const { handle } = req.params;
    
    const profile = await getHunterByHandle(handle);
    if (!profile) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hunter not registered — use GET /hunter/:handle to register first' } });
    }

    const activeJob = await getActiveJobByHandle(handle);
    if (activeJob) {
      return res.status(202).json({
        status: 'PROCESSING',
        jobId: activeJob._id,
        stage: activeJob.stage
      });
    }

    if (profile.metadata && profile.metadata.lastManualRefreshAt) {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (new Date(profile.metadata.lastManualRefreshAt) > tenMinsAgo) {
        return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Re-evaluation already requested recently, try again in 10m' } });
      }
    }

    // Set lastManualRefreshAt right now to prevent double clicks
    await updateLastManualRefresh(handle);

    const jobId = await enqueueRefreshJob(handle);
    return res.status(202).json({
      status: 'PROCESSING',
      jobId,
      estimatedTime: 15
    });
  } catch (err) {
    next(err);
  }
});

router.get('/hunter/:handle/events', (req, res) => {
  const { handle } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ stage: 'CONNECTED' })}\n\n`);

  addClient(handle, res);

  // Keep-alive ping
  const pingInterval = setInterval(() => {
    res.write(':\n\n'); // SSE comment to keep alive
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    removeClient(handle, res);
  });
});

router.get('/hunter/:handleA/compare/:handleB', async (req, res, next) => {
  try {
    const { handleA, handleB } = req.params;
    
    const [profileA, profileB] = await Promise.all([
      getHunterByHandle(handleA),
      getHunterByHandle(handleB)
    ]);

    if (!profileA || !profileB) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'One or both hunters not found or not READY'
        }
      });
    }

    return res.json({
      [profileA.handle]: profileA,
      [profileB.handle]: profileB
    });
  } catch (err) {
    next(err);
  }
});

export default router;
