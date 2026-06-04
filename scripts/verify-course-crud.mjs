/**
 * Verifies course API CRUD (requires API server + MongoDB on localhost:5000).
 * Creates a temporary instructor user, runs CRUD, then cleans up.
 */
import 'dotenv/config';

const API = process.env.API_BASE || 'http://localhost:5000/api';
const testEmail = `course-crud-${Date.now()}@test.local`;
const testPassword = 'testpass123';

function parseSetCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const parts = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return parts.map((c) => c.split(';')[0]).join('; ');
}

async function request(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  return { res, data, cookie: parseSetCookie(res.headers.getSetCookie?.() || res.headers.raw?.()?.['set-cookie']) };
}

async function main() {
  console.log('1. GET /course (public list)');
  const list = await request('/course');
  if (!list.res.ok) throw new Error(`List failed: ${list.data.message}`);
  console.log(`   OK — count: ${list.data.count}`);

  console.log('2. Register + promote to instructor via second register workaround...');
  const reg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'CRUD Tester', email: testEmail, password: testPassword },
  });
  if (!reg.res.ok) throw new Error(`Register failed: ${reg.data.message}`);

  const mongoose = (await import('mongoose')).default;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms';
  await mongoose.connect(uri);
  await mongoose.connection.collection('users').updateOne(
    { email: testEmail },
    { $set: { role: 'instructor' } }
  );
  await mongoose.disconnect();

  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: testPassword },
  });
  if (!login.res.ok) throw new Error(`Login failed: ${login.data.message}`);
  const cookie = login.cookie;
  console.log('   OK — logged in as instructor');

  const payload = {
    title: 'CRUD Test Course',
    subtitle: 'Automated test',
    description: 'This course was created by the verify-course-crud script for testing.',
    thumbnail: '',
    price: 99,
    category: 'Testing',
    level: 'beginner',
    sections: [
      {
        title: 'Intro',
        lectures: [
          {
            title: 'Welcome',
            description: 'Hello',
            videoUrl: 'https://example.com/video.mp4',
            duration: 5,
          },
        ],
      },
    ],
  };

  console.log('3. POST /course');
  const created = await request('/course', { method: 'POST', body: payload, cookie });
  if (!created.res.ok) throw new Error(`Create failed: ${created.data.message}`);
  const courseId = created.data.course._id;
  console.log(`   OK — id: ${courseId}`);

  console.log('4. GET /course/:id');
  const one = await request(`/course/${courseId}`);
  if (!one.res.ok || !one.data.course?.sections?.length) {
    throw new Error('Get by id failed or missing sections');
  }
  console.log('   OK — sections populated');

  console.log('5. PUT /course/:id');
  const updated = await request(`/course/${courseId}`, {
    method: 'PUT',
    body: { ...payload, title: 'CRUD Test Course Updated', price: 149 },
    cookie,
  });
  if (!updated.res.ok || updated.data.course.title !== 'CRUD Test Course Updated') {
    throw new Error(`Update failed: ${updated.data.message}`);
  }
  console.log('   OK — title updated');

  console.log('6. DELETE /course/:id');
  const removed = await request(`/course/${courseId}`, { method: 'DELETE', cookie });
  if (!removed.res.ok) throw new Error(`Delete failed: ${removed.data.message}`);
  console.log('   OK — deleted');

  const gone = await request(`/course/${courseId}`);
  if (gone.res.status !== 404) throw new Error('Expected 404 after delete');
  console.log('   OK — 404 after delete');

  await mongoose.connect(uri);
  await mongoose.connection.collection('users').deleteOne({ email: testEmail });
  await mongoose.disconnect();

  console.log('\nAll course CRUD checks passed.');
}

main().catch((err) => {
  console.error('\nCRUD verification failed:', err.message);
  process.exit(1);
});
