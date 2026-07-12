import { cfFetch } from './codeforcesClient.js';

export async function fetchUserRating(handle) {
  const result = await cfFetch('user.rating', { handle });
  return result;
}
