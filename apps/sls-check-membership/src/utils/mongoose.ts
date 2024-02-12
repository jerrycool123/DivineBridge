import mongoose from 'mongoose';

import { Env } from './env.js';

export const dbConnect = async () => {
  await mongoose.connect(Env.MONGO_URI);
  console.log('Connected to MongoDB');
};
