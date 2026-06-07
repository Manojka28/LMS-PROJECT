import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import * as commerceController from '../server/controllers/commerceController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const createMockRes = (name) => {
    return {
      status: function(s) { this.statusCode = s; return this; },
      json: function(d) { 
        console.log(`\n--- Response for ${name} ---`);
        console.log(JSON.stringify(d, null, 2).substring(0, 500) + '... (truncated)');
        this.data = d; 
        return this; 
      }
    };
  };

  const mockReq = { user: { role: 'admin' } };
  const mockNext = (err) => { console.error('Next called with error:', err); };

  let resFinance = createMockRes('getAdminFinance');
  await commerceController.getAdminFinance(mockReq, resFinance, mockNext);

  console.log('\n--- SUCCESS ---');
  process.exit(0);
}

verify().catch(console.error);
