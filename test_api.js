const http = require('http');

async function testApi() {
  try {
    // 1. Login as instructor
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'instructor@test.com', password: 'password123' })
    });
    
    // We might need cookies
    const cookie = loginRes.headers.get('set-cookie');
    const data = await loginRes.json();
    console.log('Login res:', data.success);

    // 2. Fetch courses
    console.log('Fetching courses...');
    const coursesRes = await fetch('http://localhost:5000/api/instructor/courses', {
      headers: { 'Cookie': cookie }
    });
    const coursesData = await coursesRes.json();
    const courseId = coursesData.courses[0]?._id;
    console.log('Got courseId:', courseId);

    // 3. Fetch students
    console.log('Fetching students...');
    const studentsRes = await fetch(`http://localhost:5000/api/instructor/course/${courseId}/students`, {
      headers: { 'Cookie': cookie }
    });
    const studentsText = await studentsRes.text();
    console.log('Students raw text:', studentsText);
  } catch (err) {
    console.error(err);
  }
}

testApi();
