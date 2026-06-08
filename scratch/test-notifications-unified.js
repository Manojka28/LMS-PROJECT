import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../server/models/User.js';
import Course from '../server/models/Course.js';
import Notification from '../server/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');

  const student = await User.findOne({ email: 'manojkumarkaswa252@gmail.com' });
  const course = await Course.findOne({});
  
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: student.email, password: 'password123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  const meRes = await fetch('http://localhost:5000/api/auth/me', { headers: { 'cookie': cookie } });
  const meData = await meRes.json();
  const loggedInUserId = meData.user.id;

  await Notification.deleteMany({ userId: loggedInUserId });

  await Notification.create({
    userId: loggedInUserId,
    type: 'COURSE_PURCHASED',
    title: 'Course Purchased',
    message: `You have successfully purchased ${course.title}.`,
    link: `/courses/${course._id}`
  });

  const fetchRes = await fetch('http://localhost:5000/api/notification', { headers: { 'cookie': cookie } });
  const fetchData = await fetchRes.json();
  console.log(`Unread Count: ${fetchData.unreadCount}, Total: ${fetchData.notifications.length}`);

  const notifToRead = fetchData.notifications[0];

  const readRes = await fetch(`http://localhost:5000/api/notification/${notifToRead._id}/read`, {
    method: 'PUT',
    headers: { 'cookie': cookie }
  });
  const readData = await readRes.json();
  console.log('Mark as Read:', readData.success);

  const delRes = await fetch(`http://localhost:5000/api/notification/${notifToRead._id}`, {
    method: 'DELETE',
    headers: { 'cookie': cookie }
  });
  const delData = await delRes.json();
  console.log('Delete:', delData.success);

  process.exit(0);
}

runTest().catch(console.error);
