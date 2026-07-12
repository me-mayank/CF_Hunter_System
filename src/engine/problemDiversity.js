/**
 * Computes problem diversity score (0-100).
 * Based on bucket coverage and entropy.
 *
 * @param {object} monsterDistribution - { [rating]: count }
 * @returns {number} score (0-100)
 */
export function computeProblemDiversity(monsterDistribution) {
  const buckets = Object.keys(monsterDistribution).filter(k => k !== 'unrated');
  if (buckets.length === 0) return 0;

  const totalRated = buckets.reduce((acc, k) => acc + monsterDistribution[k], 0);
  if (totalRated === 0) return 0;

  let entropy = 0;
  for (const bucket of buckets) {
    const p = monsterDistribution[bucket] / totalRated;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  // Max theoretical entropy for say 26 buckets (800 to 3300) is log2(26) ≈ 4.7
  const MAX_ENTROPY = 4.7;
  
  // Normalize entropy to 0-100
  let score = (entropy / MAX_ENTROPY) * 100;
  
  // Bonus for just hitting many buckets
  const coverageBonus = Math.min(buckets.length * 2, 20); // up to 20 pts bonus
  
  score += coverageBonus;

  return Math.min(Math.round(score), 100);
}
