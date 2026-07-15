import mongoose from 'mongoose';
import { Hunter } from './src/db/models/Hunter.model.js';
import { connectDB, disconnectDB } from './src/db/connection.js';

async function run() {
  await connectDB();
  const handle = 'ayushpac1011';
  const doc = await Hunter.findById(handle);
  console.log("metadata:", doc.metadata);
  await disconnectDB();
}
run();
