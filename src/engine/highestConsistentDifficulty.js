/**
 * Finds the highest consistent difficulty (rating bucket)
 * where the user has solved >= threshold problems.
 *
 * @param {object} monsterDistribution - { [rating]: count }
 * @param {number} threshold - e.g., 10
 * @returns {number} The rating or 0 if none meet threshold
 */
export function computeHighestConsistentDifficulty(monsterDistribution, threshold = 10) {
  let highest = 0;
  
  for (const [ratingStr, count] of Object.entries(monsterDistribution)) {
    if (ratingStr === 'unrated') continue;
    const rating = parseInt(ratingStr, 10);
    
    if (count >= threshold && rating > highest) {
      highest = rating;
    }
  }
  
  return highest;
}
