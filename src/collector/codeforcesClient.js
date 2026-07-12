import { request } from 'undici';
import { config } from '../config/index.js';

export class HunterNotFoundError extends Error {
  constructor(handle) {
    super(`Hunter not found on Codeforces: ${handle}`);
    this.name = 'HunterNotFoundError';
  }
}

export class CodeforcesApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CodeforcesApiError';
  }
}

let lastRequestTime = 0;
const RATE_LIMIT_MS = 2000;

/**
 * Ensures we don't hit Codeforces faster than once every RATE_LIMIT_MS.
 */
async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < RATE_LIMIT_MS) {
    const delay = RATE_LIMIT_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
}

/**
 * Makes a GET request to the Codeforces API.
 * @param {string} endpoint - API endpoint e.g., 'user.info'
 * @param {object} params - Query parameters
 * @returns {Promise<any>}
 */
export async function cfFetch(endpoint, params = {}) {
  await enforceRateLimit();

  const url = new URL(`${config.cfApiBase}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  const response = await request(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.body.json();

  if (data.status === 'FAILED') {
    if (data.comment && data.comment.includes('not found')) {
      throw new HunterNotFoundError(params.handles || params.handle);
    }
    throw new CodeforcesApiError(`Codeforces API Error: ${data.comment}`);
  }

  return data.result;
}
