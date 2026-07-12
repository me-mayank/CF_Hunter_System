import { normalize } from './normalize.js';

/**
 * Computes Mana Power (current capability).
 * 35% Rating, 25% Combat Proficiency, 15% Contest Experience, 15% Problem Diversity, 10% Active Days.
 *
 * @param {object} params
 * @param {number} params.rating
 * @param {number} params.combatProficiency
 * @param {number} params.contestExperienceScore
 * @param {number} params.problemDiversityScore
 * @param {number} params.activeDays
 * @param {object} config
 * @returns {number}
 */
export function computeManaPower(
  { rating, combatProficiency, contestExperienceScore, problemDiversityScore, activeDays },
  config
) {
  const ratingScore = normalize(rating, 0, 4000);
  const maxCP = config.maxCombatProficiency || 50000;
  const combatProfScore = normalize(combatProficiency, 0, maxCP);
  const activeDaysScore = normalize(activeDays, 0, 1000);

  const manaScore = (
    0.35 * ratingScore +
    0.25 * combatProfScore +
    0.15 * contestExperienceScore +
    0.15 * problemDiversityScore +
    0.10 * activeDaysScore
  ); // 0-100

  // Scale factor to e.g. 0-5000 range
  const scaleFactor = config.manaScaleFactor || 50; 
  
  return Math.round(manaScore * scaleFactor);
}
