import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import * as notificationController from '../server/controllers/notificationController.js';
import Notification from '../server/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const userId = new mongoose.Types.ObjectId('6a2598e338732d1a0903d70d');

  // Clear existing to establish baseline
  await Notification.deleteMany({ userId });

  // Create notification directly
  const newNotif = await Notification.create({
    userId,
    type: 'ROADMAP_CREATED',
    title: 'Career Roadmap Created',
    message: 'Your roadmap is ready!'
  });
  console.log(`Created Notification ID: ${newNotif._id}`);

  // Mock req and res
  const mockReq = { user: { _id: userId } };
  
  const createMockRes = () => {
    return {
      status: function(s) { this.statusCode = s; return this; },
      json: function(d) { this.data = d; return this; }
    };
  };

  // 1. Verify unread count increases
  let res1 = createMockRes();
  await notificationController.getNotifications(mockReq, res1);
  console.log(`Unread Count After Creation: ${res1.data.unreadCount}`);
  if (res1.data.unreadCount !== 1) throw new Error('Unread count did not increase');

  // 2. Mark notification read
  const notifToRead = res1.data.notifications[0]._id;
  let res2 = createMockRes();
  await notificationController.markAsRead({ params: { notificationId: notifToRead }, user: { _id: userId } }, res2);
  console.log(`Mark as Read Response: ${res2.data.success}`);

  // 3. Verify unread count decreases
  let res3 = createMockRes();
  await notificationController.getNotifications(mockReq, res3);
  console.log(`Unread Count After Read: ${res3.data.unreadCount}`);
  if (res3.data.unreadCount !== 0) throw new Error('Unread count did not decrease');

  // 4. Delete notification
  let res4 = createMockRes();
  await notificationController.deleteNotification({ params: { notificationId: notifToRead }, user: { _id: userId } }, res4);
  console.log(`Delete Response: ${res4.data.success}`);

  // 5. Verify removal persists
  let res5 = createMockRes();
  await notificationController.getNotifications(mockReq, res5);
  console.log(`Total Notifications After Delete: ${res5.data.notifications.length}`);
  if (res5.data.notifications.length !== 0) throw new Error('Notification was not removed');

  console.log('\n--- SUCCESS: All runtime verification checks passed! ---');
  process.exit(0);
}

verify().catch(console.error);
