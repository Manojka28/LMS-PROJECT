import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../server/models/User.js';
import Notification from '../server/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  console.log('Connected to DB');

  const student = await User.findOne({ email: 'manojkumarkaswa252@gmail.com' });

  // Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: student.email, password: 'password123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) throw new Error('No cookie received');

  // 1. Fetch Notifications
  console.log('\n--- FETCH NOTIFICATIONS ---');
  const fetchRes = await fetch('http://localhost:5000/api/notification', {
    headers: { 'cookie': cookie }
  });
  const fetchData = await fetchRes.json();
  console.log(`Success: ${fetchData.success}, Unread Count: ${fetchData.unreadCount}, Total Notifications: ${fetchData.notifications.length}`);

  if (fetchData.notifications.length === 0) process.exit(1);

  const notifToRead = fetchData.notifications[0];
  const notifToDelete = fetchData.notifications[1];

  // 2. Mark as Read
  console.log('\n--- MARK AS READ ---');
  const readRes = await fetch(`http://localhost:5000/api/notification/${notifToRead._id}/read`, {
    method: 'PUT',
    headers: { 'cookie': cookie }
  });
  const readData = await readRes.json();
  console.log('Mark as Read response:', readData);

  // 3. Delete Notification
  console.log('\n--- DELETE NOTIFICATION ---');
  const delRes = await fetch(`http://localhost:5000/api/notification/${notifToDelete._id}`, {
    method: 'DELETE',
    headers: { 'cookie': cookie }
  });
  const delData = await delRes.json();
  console.log('Delete response:', delData);

  // 4. Verify Final State
  console.log('\n--- VERIFY FINAL STATE ---');
  const finalRes = await fetch('http://localhost:5000/api/notification', {
    headers: { 'cookie': cookie }
  });
  const finalData = await finalRes.json();
  console.log(`Final Unread Count: ${finalData.unreadCount}, Final Total: ${finalData.notifications.length}`);
  console.log('Is read?', finalData.notifications.find(n => n._id === notifToRead._id).isRead);

  process.exit(0);
}

runTest().catch(console.error);
