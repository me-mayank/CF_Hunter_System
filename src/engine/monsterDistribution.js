/**
 * Computes the monster distribution from user submissions.
 * Only counts unique problems solved (verdict === 'OK') grouped by rating.
 * Problems without a rating are placed in an 'unrated' bucket.
 *
 * @param {Array<object>} userStatus - submissions from user.status
 * @returns {object} { distribution: { rating: count }, problemsDefeated: number }
 */
export function computeMonsterDistribution(userStatus) {
  const solved = new Set();
  const distribution = {};
  let problemsDefeated = 0;

  for (const sub of userStatus) {
    if (sub.verdict === 'OK') {
      const problem = sub.problem;
      const key = `${problem.contestId || 'no-contest'}_${problem.index}`;

      if (!solved.has(key)) {
        solved.add(key);
        problemsDefeated++;

        const ratingBucket = problem.rating || 'unrated';
        distribution[ratingBucket] = (distribution[ratingBucket] || 0) + 1;
      }
    }
  }

  return { distribution, problemsDefeated };
}
