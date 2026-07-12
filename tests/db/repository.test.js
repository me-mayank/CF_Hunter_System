import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from '../../src/config/index.js';
import { connectDB, disconnectDB } from '../../src/db/connection.js';
import { upsertHunter, getHunterByHandle } from '../../src/db/repositories/hunter.repository.js';
import { createJob, getActiveJobByHandle, updateJobStatus } from '../../src/db/repositories/hunterJob.repository.js';
import { setConfig, getConfig } from '../../src/db/repositories/systemConfig.repository.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Override config so connection uses memory server
  config.mongoUri = uri;
  
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
  await mongoServer.stop();
});

describe('Data Layer Integration Tests', () => {

  test('SystemConfig Repository', async () => {
    await setConfig('engineVersion', '1.0.0');
    const val = await getConfig('engineVersion');
    expect(val).toBe('1.0.0');
  });

  test('Hunter Repository - upsert and get', async () => {
    const profile = {
      handle: 'Tourist',
      hunterRank: { rating: 3800, rank: 'legendary grandmaster' },
      hunterLevel: 97,
      metadata: { engineVersion: '1.0.0' }
    };

    const saved = await upsertHunter(profile);
    expect(saved._id).toBe('tourist'); // Should be lowercase
    expect(saved.hunterLevel).toBe(97);

    const fetched = await getHunterByHandle('TOURIST');
    expect(fetched).toBeDefined();
    expect(fetched.handle).toBe('Tourist');
  });

  test('HunterJob Repository', async () => {
    const jobData = {
      _id: 'job-123',
      handle: 'tourist',
      type: 'REGISTER'
    };

    await createJob(jobData);
    
    const active = await getActiveJobByHandle('tourist');
    expect(active).toBeDefined();
    expect(active._id).toBe('job-123');

    await updateJobStatus('job-123', { status: 'READY' });

    const activeNow = await getActiveJobByHandle('tourist');
    expect(activeNow).toBeNull(); // Since status is no longer PROCESSING
  });

});
