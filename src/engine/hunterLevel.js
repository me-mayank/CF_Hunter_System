import { normalize } from './normalize.js';

/**
 * Computes Hunter Level Score.
 * 20% Rating, 20% Diversity, 20% Contest Experience, 20% Active Days, 20% Combat Proficiency.
 *
 * @param {object} params
 * @param {number} params.rating
 * @param {number} params.problemDiversityScore
 * @param {number} params.contestExperienceScore
 * @param {number} params.activeDays
 * @param {number} params.combatProficiency
 * @param {number} params.previousHunterLevel
 * @param {object} config - System config rules
 * @returns {number} 
 */
export function computeHunterLevel(
  { rating, problemDiversityScore, contestExperienceScore, activeDays, combatProficiency, previousHunterLevel = 0 },
  config
) {
  // Normalize individual components (0-100)
  const ratingScore = normalize(rating, 0, 4000);
  const activeDaysScore = normalize(activeDays, 0, 1000); // 1000 days gets 100 points
  
  // 30,000 max combat proficiency (e.g. tourist has ~40-50k actually, let's normalize to something reasonable or rely on config)
  // Let's assume config.maxCombatProficiency is defined, default 50000
  const maxCP = config.maxCombatProficiency || 50000;
  const combatProfScore = normalize(combatProficiency, 0, maxCP);

  const rawLevel = (
    0.20 * ratingScore +
    0.20 * problemDiversityScore +
    0.20 * contestExperienceScore +
    0.20 * activeDaysScore +
    0.20 * combatProfScore
  );

  const decayFloor = config.hunterLevelDecayFloor || 0.98;
  const newLevel = Math.max(rawLevel, previousHunterLevel * decayFloor);

  return Math.round(newLevel);
}
