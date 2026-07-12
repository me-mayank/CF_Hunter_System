import { cfFetch } from './codeforcesClient.js';

export async function fetchUserInfo(handle) {
  const result = await cfFetch('user.info', { handles: handle });
  return result[0];
}
