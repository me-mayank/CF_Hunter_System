const WEIGHT_TABLE = {
  800: 1,
  900: 2,
  1000: 3,
  1100: 5,
  1200: 7,
  1300: 10,
  1400: 14,
  1500: 19,
  1600: 25,
  1700: 32,
  1800: 40,
  1900: 50,
  2000: 63,
  2100: 78,
  2200: 95,
  2300: 115,
};

/**
 * Returns the weight for a given rating.
 * Extrapolates beyond 2300 using a geometric progression (~1.21 multiplier per 100 points).
 */
export function getWeight(rating) {
  if (rating < 800) return 0; // Or 1, but usually 800 is min CF rating
  if (WEIGHT_TABLE[rating]) return WEIGHT_TABLE[rating];

  // If below 800 but not in table (e.g., 0 or unrated)
  if (rating < 2300) {
    // Interpolation or fallback (shouldn't happen for standard CF ratings, but just in case)
    const lower = Math.floor(rating / 100) * 100;
    return WEIGHT_TABLE[lower] || 0;
  }

  // Extrapolation for > 2300
  const stepsAbove2300 = (rating - 2300) / 100;
  const multiplier = 115 / 95; // ~1.21
  return Math.floor(115 * Math.pow(multiplier, stepsAbove2300));
}

/**
 * Computes Combat Proficiency (Weightage Score).
 * @param {object} monsterDistribution - { [rating]: count }
 * @returns {number}
 */
export function computeCombatProficiency(monsterDistribution) {
  let score = 0;
  for (const [ratingStr, count] of Object.entries(monsterDistribution)) {
    if (ratingStr === 'unrated') continue;
    const rating = parseInt(ratingStr, 10);
    score += getWeight(rating) * count;
  }
  return score;
}
