/**
 * Computes Contest Experience Score (0-100).
 * Based on rated contest count, peak rating, and history span.
 *
 * @param {Array<object>} userRating - contest history from user.rating
 * @returns {number} score (0-100)
 */
export function computeContestExperience(userRating) {
  if (!userRating || userRating.length === 0) return 0;

  const contestCount = userRating.length;
  let peakRating = 0;
  
  for (const contest of userRating) {
    if (contest.newRating > peakRating) {
      peakRating = contest.newRating;
    }
  }

  const firstContestDate = userRating[0].ratingUpdateTimeSeconds;
  const lastContestDate = userRating[userRating.length - 1].ratingUpdateTimeSeconds;
  
  const spanSeconds = Math.max(0, lastContestDate - firstContestDate);
  const spanDays = spanSeconds / (60 * 60 * 24);

  // Normalize components
  // Max count ~150 gets 100 points
  const countScore = Math.min((contestCount / 150) * 100, 100);
  
  // Max span ~1825 days (5 years) gets 100 points
  const spanScore = Math.min((spanDays / 1825) * 100, 100);
  
  // Max peak ~3500 gets 100 points
  const peakScore = Math.min((peakRating / 3500) * 100, 100);

  // Weighted average: 40% count, 30% span, 30% peak
  const finalScore = (0.4 * countScore) + (0.3 * spanScore) + (0.3 * peakScore);

  return Math.round(finalScore);
}
