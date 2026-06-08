import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../server/models/User.js';
import Notification from '../server/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const student = await User.findOne({ email: 'manojkumarkaswa252@gmail.com' });
  
  // 1. Login to get cookie
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: student.email, password: 'password123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  
  const meRes = await fetch('http://localhost:5000/api/auth/me', { headers: { 'cookie': cookie } });
  const meData = await meRes.json();
  const userId = meData.user.id;

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
  let fetchRes = await fetch('http://localhost:5000/api/notification', { headers: { 'cookie': cookie } });
  let fetchData = await fetchRes.json();
  console.log(`Unread Count After Creation: ${fetchData.unreadCount}`);

  if (fetchData.unreadCount !== 1) throw new Error('Unread count did not increase');

  // 4. Mark notification read
  const notifToRead = fetchData.notifications[0]._id;
  const readRes = await fetch(`http://localhost:5000/api/notification/${notifToRead}/read`, {
    method: 'PUT',
    headers: { 'cookie': cookie }
  });
  const readData = await readRes.json();
  console.log(`Mark as Read Response: ${readData.success}`);

  // 5. Verify unread count decreases
  fetchRes = await fetch('http://localhost:5000/api/notification', { headers: { 'cookie': cookie } });
  fetchData = await fetchRes.json();
  console.log(`Unread Count After Read: ${fetchData.unreadCount}`);

  if (fetchData.unreadCount !== 0) throw new Error('Unread count did not decrease');

  // 6. Delete notification
  const delRes = await fetch(`http://localhost:5000/api/notification/${notifToRead}`, {
    method: 'DELETE',
    headers: { 'cookie': cookie }
  });
  const delData = await delRes.json();
  console.log(`Delete Response: ${delData.success}`);

  // 7. Verify removal persists
  fetchRes = await fetch('http://localhost:5000/api/notification', { headers: { 'cookie': cookie } });
  fetchData = await fetchRes.json();
  console.log(`Total Notifications After Delete: ${fetchData.notifications.length}`);

  if (fetchData.notifications.length !== 0) throw new Error('Notification was not removed');

  console.log('SUCCESS: All runtime verification checks passed!');
  process.exit(0);
}

verify().catch(console.error);
