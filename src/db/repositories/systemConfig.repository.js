import { SystemConfig } from '../models/SystemConfig.model.js';

export async function getConfig(key) {
  const conf = await SystemConfig.findOne({ key }).lean();
  return conf ? conf.value : null;
}

export async function setConfig(key, value) {
  return SystemConfig.findOneAndUpdate(
    { key },
    { $set: { value } },
    { new: true, upsert: true, lean: true }
  );
}

export async function getAllConfig() {
  const configs = await SystemConfig.find().lean();
  const result = {};
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return result;
}
