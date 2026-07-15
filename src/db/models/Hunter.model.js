import mongoose from 'mongoose';

const hunterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Codeforces handle, lowercase
  handle: { type: String, required: true },
  hunterRank: {
    rating: { type: Number, default: 0 },
    rank: { type: String, default: 'unrated' }
  },
  hunterLevel: { type: Number, default: 0 },
  manaPower: { type: Number, default: 0 },
  peakManaPower: { type: Number, default: 0 },
  combatProficiency: { type: Number, default: 0 },
  problemsDefeated: { type: Number, default: 0 },
  highestMonsterDefeated: { type: Number, default: 0 },
  highestConsistentDifficulty: { type: Number, default: 0 },
  problemDiversityScore: { type: Number, default: 0 },
  contestExperienceScore: { type: Number, default: 0 },
  activeDays: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  monsterDistribution: { type: Map, of: Number, default: {} },
  skillAffinities: {
    Strength: { type: Number, default: 0 },
    Intelligence: { type: Number, default: 0 },
    Perception: { type: Number, default: 0 },
    Magic: { type: Number, default: 0 },
    Agility: { type: Number, default: 0 },
    Strategy: { type: Number, default: 0 }
  },
  rawTagCounts: { type: Map, of: Number, default: {} },
  combatRecord: {
    monsterDistribution: { type: Map, of: Number, default: {} },
    tagDistribution: { type: Map, of: Number, default: {} }
  },
  achievements: [{ type: String }],
  metadata: {
    lastSubmissionId: { type: Number, default: 0 },
    lastContestId: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    lastManualRefreshAt: { type: Date },
    engineVersion: { type: String, required: true },
    registeredAt: { type: Date, default: Date.now }
  }
}, {
  // Disabling strict ensures we don't accidentally drop fields, 
  // but strict: true is safer for staying in 512MB limit.
  strict: true,
  // We don't need timestamps since we track metadata.lastUpdated
  timestamps: false
});

// Since _id is the lowercase handle, it is inherently indexed and unique. No need to add { unique: true } to handle string if we always search by _id.
// But we'll keep handle indexed just in case we query by it case-insensitively, or we just rely on _id.
hunterSchema.index({ handle: 1 }, { unique: true });

export const Hunter = mongoose.model('Hunter', hunterSchema);
