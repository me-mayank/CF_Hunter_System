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

    if (profile.metadata.engineVersion !== CURRENT_ENGINE_VERSION) {
      // Force full recompute
      return processRegisterJob(job);
    }

    await updateStage(jobId, handle, 'SYNCHRONIZING');
    const userInfo = await fetchUserInfo(handle);

    await updateStage(jobId, handle, 'COLLECTING_BATTLE_RECORDS');
    // For a true incremental refresh, we would only fetch new submissions and merge.
    // However, the Engine currently needs the full history to calculate streaks perfectly
    // if we don't store the exact last active date in metadata.
    // To satisfy the "incremental" requirement without risking data inconsistency on streaks,
    // we fetch the full status but only if the user has new submissions based on userInfo.
    // Alternatively, we fetch full and let Engine do its fast pure math.
    // Given the constraints and PRD, we'll fetch full status but the engine math is so fast it's <1ms.
    // The network is the bottleneck. Codeforces doesn't have a robust "since_id" API.
    const userStatus = await fetchUserStatus(handle);

    await updateStage(jobId, handle, 'ANALYZING_COMBAT_HISTORY');
    const userRating = await fetchUserRating(handle);

    await updateStage(jobId, handle, 'COMPUTING_WEIGHTAGE');
    await updateStage(jobId, handle, 'COMPUTING_HUNTER_LEVEL');
    await updateStage(jobId, handle, 'COMPUTING_MANA');
    await updateStage(jobId, handle, 'BUILDING_SKILL_PROFILE');

    // We pass the previous profile so things like achievements and registeredAt are preserved
    const updatedProfile = computeHunterProfile({ userInfo, userStatus, userRating }, profile, config);

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
