import mongoose from 'mongoose';
import fetch from 'node-fetch';
import { Hunter } from './src/db/models/Hunter.model.js';
import { connectDB, disconnectDB } from './src/db/connection.js';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  await connectDB();
  const handle = 'ayushpac1011';
  
  // Check 1 - Before
  const docs = await Hunter.find({ handle });
  console.log(`\n=== CHECK 1: Document Count ===`);
  console.log(`Count before: ${docs.length}`);
  if (docs.length > 0) {
    console.log(`_id before: ${docs[0]._id}`);
  }

  // Check 2 - Before (Modify DB to simulate 1 missing problem)
  console.log(`\n=== CHECK 2: Data Refresh ===`);
  if (docs.length > 0) {
    const realProblems = docs[0].problemsDefeated;
    console.log(`Original problemsDefeated: ${realProblems}`);
    await Hunter.updateOne({ _id: handle }, { $set: { problemsDefeated: realProblems - 1 } });
    const modified = await Hunter.findById(handle);
    console.log(`Simulated problemsDefeated: ${modified.problemsDefeated}`);
  }

  // Check 5 - Duplicate-job guard
  console.log(`\n=== CHECK 5: Duplicate Job Guard ===`);
  // Clear any existing job
  await mongoose.connection.collection('hunter_jobs').deleteMany({ handle });
  // Clear lastManualRefreshAt so it doesn't 429 immediately
  await Hunter.updateOne({ _id: handle }, { $unset: { 'metadata.lastManualRefreshAt': 1 } });

  console.log(`Sending first refresh request...`);
  const res1 = await fetch(`http://localhost:3000/hunter/${handle}/refresh`, { method: 'POST' });
  const data1 = await res1.json();
  console.log(`First request response: ${res1.status}`, data1);

  console.log(`Sending second refresh request immediately...`);
  const res2 = await fetch(`http://localhost:3000/hunter/${handle}/refresh`, { method: 'POST' });
  const data2 = await res2.json();
  console.log(`Second request response: ${res2.status}`, data2);
  if (data1.jobId && data1.jobId === data2.jobId) {
    console.log(`✅ Duplicate job guard works (same jobId returned)`);
  } else {
    console.log(`❌ Duplicate job guard failed`);
  }

  // Wait for job to finish
  console.log(`\nWaiting for job to finish...`);
  while (true) {
    const statusRes = await fetch(`http://localhost:3000/hunter/${handle}/status`);
    const statusData = await statusRes.json();
    if (statusData.status === 'READY') break;
    if (statusData.status === 'FAILED') {
      console.log('Job failed!');
      break;
    }
    await sleep(1000);
  }
  console.log(`Job finished!`);

  // Check 1 - After
  console.log(`\n=== CHECK 1: Document Count (After) ===`);
  const docsAfter = await Hunter.find({ handle });
  console.log(`Count after: ${docsAfter.length}`);
  if (docsAfter.length > 0) {
    console.log(`_id after: ${docsAfter[0]._id}`);
    if (docs[0]._id === docsAfter[0]._id) console.log(`✅ Document updated in-place (upsert successful)`);
  }

  // Check 2 - After
  console.log(`\n=== CHECK 2: Data Refresh (After) ===`);
  console.log(`Final problemsDefeated: ${docsAfter[0].problemsDefeated}`);
  if (docsAfter[0].problemsDefeated === docs[0].problemsDefeated) {
    console.log(`✅ Data recomputed correctly (problemsDefeated increased by 1 back to true value)`);
  }

  // Check 3 - Rate Limiting
  console.log(`\n=== CHECK 3: Rate Limiting ===`);
  const res3 = await fetch(`http://localhost:3000/hunter/${handle}/refresh`, { method: 'POST' });
  const data3 = await res3.json();
  console.log(`Third request (should be rate limited): ${res3.status}`, data3);
  if (res3.status === 429) {
    console.log(`✅ Rate limiting works`);
  }

  // Check 4 - 404 for unregistered
  console.log(`\n=== CHECK 4: Unregistered Handle ===`);
  const res4 = await fetch(`http://localhost:3000/hunter/never_registered_handle_123/refresh`, { method: 'POST' });
  const data4 = await res4.json();
  console.log(`Unregistered request: ${res4.status}`, data4);
  if (res4.status === 404) {
    console.log(`✅ 404 check works`);
  }

  await disconnectDB();
}

run().catch(console.error);
