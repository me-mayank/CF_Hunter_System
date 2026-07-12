import mongoose from 'mongoose';
import { config } from '../config/index.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  if (process.env.NODE_ENV !== 'test' && (!config.mongoUri || !config.mongoUri.includes('mongodb+srv://'))) {
    throw new Error('MONGO_URI must be set to a valid MongoDB Atlas connection string (mongodb+srv://...)');
  }

  try {
    const db = await mongoose.connect(config.mongoUri, {
      // Mongoose 6+ default options are usually enough
      // To respect M0 connection limits, we might want to cap poolSize if needed,
      // but the default is usually 100 which is fine for a single process.
      // E.g., maxPoolSize: 50
      maxPoolSize: 50, 
    });

    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected');
}
