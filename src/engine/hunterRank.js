/**
 * Extracts Hunter Rank (rating and rank) from Codeforces user info.
 * @param {object} userInfo - from user.info Codeforces API
 * @returns {object} { rating, rank }
 */
export function computeHunterRank(userInfo) {
  return {
    rating: userInfo.rating || 0,
    rank: userInfo.rank || 'unrated',
  };
}
