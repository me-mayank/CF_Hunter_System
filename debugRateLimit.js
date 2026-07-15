import { connectDB, disconnectDB } from './src/db/connection.js';
import { Hunter } from './src/db/models/Hunter.model.js';

async function run() {
  await connectDB();
  const handle = 'ayushpac1011';
  const profile = await Hunter.findById(handle).lean();
  
  if (profile.metadata && profile.metadata.lastManualRefreshAt) {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const last = new Date(profile.metadata.lastManualRefreshAt);
    console.log("last:", last);
    console.log("tenMinsAgo:", tenMinsAgo);
    console.log("last > tenMinsAgo:", last > tenMinsAgo);
  } else {
    console.log("Missing lastManualRefreshAt");
  }
  await disconnectDB();
}
run();
