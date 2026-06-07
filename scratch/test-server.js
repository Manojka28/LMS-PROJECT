import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as notificationController from '../server/controllers/notificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
  req.user = { _id: new mongoose.Types.ObjectId('6a2598e338732d1a0903d70d') };
  next();
});

app.get('/api/notification', notificationController.getNotifications);
app.put('/api/notification/:notificationId/read', notificationController.markAsRead);
app.delete('/api/notification/:notificationId', notificationController.deleteNotification);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms').then(() => {
  const server = app.listen(5002, () => {
    console.log('Test server running on 5002');
  });
});
