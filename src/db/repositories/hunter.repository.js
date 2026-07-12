import { Hunter } from '../models/Hunter.model.js';

export async function getHunterByHandle(handle) {
  const normalizedHandle = handle.toLowerCase();
  return Hunter.findById(normalizedHandle).lean();
}

export async function upsertHunter(profile) {
  const normalizedHandle = profile.handle.toLowerCase();
  
  // We use findOneAndUpdate with upsert to create or update the profile
  return Hunter.findOneAndUpdate(
    { _id: normalizedHandle },
    { $set: profile },
    { new: true, upsert: true, lean: true }
  );
}

export async function getOutdatedHunters(dateBefore) {
  return Hunter.find({ 'metadata.lastUpdated': { $lt: dateBefore } }).lean();
}
