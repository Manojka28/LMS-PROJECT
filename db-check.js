import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Certificate from './server/models/Certificate.js';
import { connectDB } from './server/config/db.js';

async function check() {
  await connectDB();
  
  const total = await Certificate.countDocuments();
  const certs = await Certificate.find({}).lean();
  
  console.log('Total certificates:', total);
  if (total > 0) {
    console.log('Sample cert:', JSON.stringify(certs[0], null, 2));
  }
  
  process.exit(0);
}

check();
