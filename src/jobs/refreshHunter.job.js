import { fetchUserInfo } from '../collector/fetchUserInfo.js';
import { fetchUserStatus } from '../collector/fetchUserStatus.js';
import { fetchUserRating } from '../collector/fetchUserRating.js';
import { computeHunterProfile } from '../engine/index.js';
import { getHunterByHandle, upsertHunter } from '../db/repositories/hunter.repository.js';
import { updateJobStatus } from '../db/repositories/hunterJob.repository.js';
import { getAllConfig } from '../db/repositories/systemConfig.repository.js';
import { emitEvent } from '../realtime/sseHub.js';
import { CURRENT_ENGINE_VERSION } from '../engine/engineVersion.js';
import { processRegisterJob } from './registerHunter.job.js';

async function updateStage(jobId, handle, stage, payload = null) {
  await updateJobStatus(jobId, { stage });
  emitEvent(handle, stage, payload);
}

export async function processRefreshJob(job) {
  const { jobId, handle } = job.data;
  
  try {
    const config = await getAllConfig();
    const profile = await getHunterByHandle(handle);

    if (!profile) {
      // Fallback to full register if profile is missing
      return processRegisterJob(job);
    }

    await updateStage(jobId, handle, 'SYNCHRONIZING');
    const userInfo = await fetchUserInfo(handle);

    await updateStage(jobId, handle, 'COLLECTING_BATTLE_RECORDS');
    const userStatus = await fetchUserStatus(handle);

    await updateStage(jobId, handle, 'ANALYZING_COMBAT_HISTORY');
    const userRating = await fetchUserRating(handle);

    await updateStage(jobId, handle, 'COMPUTING_WEIGHTAGE');
    await updateStage(jobId, handle, 'COMPUTING_HUNTER_LEVEL');
    await updateStage(jobId, handle, 'COMPUTING_MANA');
    await updateStage(jobId, handle, 'BUILDING_SKILL_PROFILE');

    // We pass the previous profile so things like achievements, registeredAt, and lastManualRefreshAt are preserved
    const updatedProfile = computeHunterProfile({ userInfo, userStatus, userRating }, profile, config);
    
    // Preserve lastManualRefreshAt manually since computeHunterProfile doesn't map it automatically
    if (profile.metadata && profile.metadata.lastManualRefreshAt) {
      updatedProfile.metadata.lastManualRefreshAt = profile.metadata.lastManualRefreshAt;
    }

    await updateStage(jobId, handle, 'REGISTERING_HUNTER');
    await upsertHunter(updatedProfile);

    await updateJobStatus(jobId, { status: 'READY', stage: 'READY' });
    emitEvent(handle, 'READY', updatedProfile);

    return updatedProfile;
  } catch (error) {
    console.error(`Refresh job ${jobId} failed:`, error);
    await updateJobStatus(jobId, { status: 'FAILED', error: error.message });
    emitEvent(handle, 'FAILED', { error: 'INTERNAL_ERROR' });
    throw error;
  }
}
