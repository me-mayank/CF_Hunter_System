import { cfFetch } from './codeforcesClient.js';

export async function fetchUserStatus(handle) {
  // Omit 'from' and 'count' to get all submissions
  const result = await cfFetch('user.status', { handle });
  return result;
}
