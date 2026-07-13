/**
 * Extracts Hunter Rank (rating and rank) from Codeforces user info.
 * @param {object} userInfo - from user.info Codeforces API
 * @returns {object} { rating, rank }
 */
export function computeHunterRank(userInfo) {
  return {
    rating: userInfo.maxRating || userInfo.rating || 0,
    rank: userInfo.maxRank || userInfo.rank || 'unrated',
  };
}
