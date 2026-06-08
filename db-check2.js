import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Certificate from './server/models/Certificate.js';
import { connectDB } from './server/config/db.js';

async function check() {
  await connectDB();
  
  const total = await Certificate.countDocuments();
  console.log('Total certificates:', total);
  
  const certs = await Certificate.find({}).lean();
  console.log('Certificates:', JSON.stringify(certs, null, 2));
  
  process.exit(0);
}

check();
