import { cfFetch } from './codeforcesClient.js';

export async function fetchProblemset() {
  const result = await cfFetch('problemset.problems');
  return result;
}
