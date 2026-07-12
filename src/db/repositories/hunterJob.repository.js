import { HunterJob } from '../models/HunterJob.model.js';

export async function createJob(jobData) {
  const job = new HunterJob(jobData);
  return job.save();
}

export async function getActiveJobByHandle(handle) {
  return HunterJob.findOne({
    handle: handle.toLowerCase(),
    status: 'PROCESSING'
  }).lean();
}

export async function getJobById(jobId) {
  return HunterJob.findById(jobId).lean();
}

export async function updateJobStatus(jobId, updates) {
  return HunterJob.findByIdAndUpdate(
    jobId,
    { $set: updates },
    { new: true, lean: true }
  );
}
