import mongoose from 'mongoose';

const hunterJobSchema = new mongoose.Schema({
  // _id will be a UUID
  _id: { type: String, required: true },
  handle: { type: String, required: true },
  type: { type: String, enum: ['REGISTER', 'REFRESH'], required: true },
  status: { type: String, enum: ['PROCESSING', 'READY', 'FAILED', 'NOT_FOUND'], default: 'PROCESSING' },
  stage: { type: String },
  error: { type: String, default: null }
}, {
  timestamps: true // adds createdAt, updatedAt
});

// TTL index on updatedAt to auto-expire jobs after 48 hours (172800 seconds)
// This is critical for the Atlas M0 512MB storage limit!
hunterJobSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 172800 });

// Compound index on handle + status for checking existing jobs
hunterJobSchema.index({ handle: 1, status: 1 });

export const HunterJob = mongoose.model('HunterJob', hunterJobSchema);
