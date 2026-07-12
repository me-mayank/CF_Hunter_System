import { fetchUserInfo } from '../collector/fetchUserInfo.js';
import { fetchUserStatus } from '../collector/fetchUserStatus.js';
import { fetchUserRating } from '../collector/fetchUserRating.js';
import { computeHunterProfile } from '../engine/index.js';
import { upsertHunter } from '../db/repositories/hunter.repository.js';
import { updateJobStatus } from '../db/repositories/hunterJob.repository.js';
import { getAllConfig } from '../db/repositories/systemConfig.repository.js';
import { emitEvent } from '../realtime/sseHub.js';
import { HunterNotFoundError } from '../collector/codeforcesClient.js';

async function updateStage(jobId, handle, stage, payload = null) {
  await updateJobStatus(jobId, { stage });
  emitEvent(handle, stage, payload);
}

export async function processRegisterJob(job) {
  const { jobId, handle } = job.data;
  
  try {
    const config = await getAllConfig();

    await updateStage(jobId, handle, 'SYNCHRONIZING');
    const userInfo = await fetchUserInfo(handle);

    await updateStage(jobId, handle, 'COLLECTING_BATTLE_RECORDS');
    const userStatus = await fetchUserStatus(handle);

    await updateStage(jobId, handle, 'ANALYZING_COMBAT_HISTORY');
    const userRating = await fetchUserRating(handle);

    // Engine computation is fast, but we'll emit stages for UX as per PRD
    await updateStage(jobId, handle, 'COMPUTING_WEIGHTAGE');
    await updateStage(jobId, handle, 'COMPUTING_HUNTER_LEVEL');
    await updateStage(jobId, handle, 'COMPUTING_MANA');
    await updateStage(jobId, handle, 'BUILDING_SKILL_PROFILE');

    const profile = computeHunterProfile({ userInfo, userStatus, userRating }, null, config);

    await updateStage(jobId, handle, 'REGISTERING_HUNTER');
    await upsertHunter(profile);

    // Mark READY
    await updateJobStatus(jobId, { status: 'READY', stage: 'READY' });
    emitEvent(handle, 'READY', profile);

    return profile;
  } catch (error) {
    if (error instanceof HunterNotFoundError) {
      await updateJobStatus(jobId, { status: 'NOT_FOUND', error: error.message });
      emitEvent(handle, 'FAILED', { error: 'NOT_FOUND' });
    } else {
      console.error(`Register job ${jobId} failed:`, error);
      await updateJobStatus(jobId, { status: 'FAILED', error: error.message });
      emitEvent(handle, 'FAILED', { error: 'INTERNAL_ERROR' });
    }
    throw error;
  }
}
