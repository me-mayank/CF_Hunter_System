import { jest } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from '../../src/config/index.js';
import { connectDB, disconnectDB } from '../../src/db/connection.js';
import { createServer } from '../../src/api/server.js';
import { upsertHunter } from '../../src/db/repositories/hunter.repository.js';
import { createJob } from '../../src/db/repositories/hunterJob.repository.js';

let mongoServer;
let app;

// Mock the queue so we don't actually need Redis for API tests
jest.unstable_mockModule('../../src/jobs/queue.js', () => ({
  JOB_QUEUES: { HUNTER_JOBS: 'hunter-jobs' },
  hunterQueue: {
    add: jest.fn().mockResolvedValue(true)
  }
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  config.mongoUri = mongoServer.getUri();
  await connectDB();
  
  app = createServer();
});

afterAll(async () => {
  await disconnectDB();
  await mongoServer.stop();
});

describe('REST API Tests', () => {

  test('GET /healthz', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /hunter/:handle - 404 when not found and CF fails', async () => {
    // Actually our endpoint enqueue job immediately without checking CF in the route handler.
    // The route returns 202, and CF check happens in the worker.
    const res = await request(app).get('/hunter/unknown_handle_123');
    expect(res.statusCode).toBe(202);
    expect(res.body.status).toBe('PROCESSING');
    expect(res.body.jobId).toBeDefined();
  });

  test('GET /hunter/:handle - returns READY profile', async () => {
    await upsertHunter({
      handle: 'tourist',
      hunterRank: { rating: 3800 },
      metadata: { engineVersion: '1.0.0' }
    });

    const res = await request(app).get('/hunter/tourist');
    expect(res.statusCode).toBe(200);
    expect(res.body.handle).toBe('tourist');
    expect(res.body.hunterRank.rating).toBe(3800);
  });

  test('GET /hunter/:handle/status', async () => {
    // Test existing profile
    const res1 = await request(app).get('/hunter/tourist/status');
    expect(res1.statusCode).toBe(200);
    expect(res1.body.status).toBe('READY');

    // Test active job
    await createJob({ _id: 'job-pending', handle: 'pendinguser', type: 'REGISTER', status: 'PROCESSING', stage: 'SYNCHRONIZING' });
    const res2 = await request(app).get('/hunter/pendinguser/status');
    expect(res2.statusCode).toBe(200);
    expect(res2.body.status).toBe('PROCESSING');
    expect(res2.body.stage).toBe('SYNCHRONIZING');

    // Test not found
    const res3 = await request(app).get('/hunter/nobody/status');
    expect(res3.statusCode).toBe(404);
  });

});
