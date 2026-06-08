import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Notification from '../server/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const userId = '6a2598e338732d1a0903d70d';

  // Clear existing to establish baseline
  await Notification.deleteMany({ userId });

  // 2. Create notification directly
  const newNotif = await Notification.create({
    userId,
    type: 'ROADMAP_CREATED',
    title: 'Career Roadmap Created',
    message: 'Your roadmap is ready!'
  });
  console.log(`Created Notification ID: ${newNotif._id}`);

  // 3. Verify unread count increases
  let fetchRes = await fetch('http://localhost:5002/api/notification');
  let fetchData = await fetchRes.json();
  console.log(`Unread Count After Creation: ${fetchData.unreadCount}`);

  if (fetchData.unreadCount !== 1) throw new Error('Unread count did not increase');

  // 4. Mark notification read
  const notifToRead = fetchData.notifications[0]._id;
  const readRes = await fetch(`http://localhost:5002/api/notification/${notifToRead}/read`, {
    method: 'PUT'
  });
  const readData = await readRes.json();
  console.log(`Mark as Read Response: ${readData.success}`);

  // 5. Verify unread count decreases
  fetchRes = await fetch('http://localhost:5002/api/notification');
  fetchData = await fetchRes.json();
  console.log(`Unread Count After Read: ${fetchData.unreadCount}`);

  if (fetchData.unreadCount !== 0) throw new Error('Unread count did not decrease');

  // 6. Delete notification
  const delRes = await fetch(`http://localhost:5002/api/notification/${notifToRead}`, {
    method: 'DELETE'
  });
  const delData = await delRes.json();
  console.log(`Delete Response: ${delData.success}`);

  // 7. Verify removal persists
  fetchRes = await fetch('http://localhost:5002/api/notification');
  fetchData = await fetchRes.json();
  console.log(`Total Notifications After Delete: ${fetchData.notifications.length}`);

  if (fetchData.notifications.length !== 0) throw new Error('Notification was not removed');

  console.log('SUCCESS: All runtime verification checks passed!');
  process.exit(0);
}

verify().catch(console.error);
