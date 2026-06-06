async function testApi() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
    });
    
    const cookie = loginRes.headers.get('set-cookie');
    const data = await loginRes.json();
    console.log('Login res:', data);

    const coursesRes = await fetch('http://localhost:5000/api/instructor/courses', {
      headers: { 'Cookie': cookie }
    });
    const coursesData = await coursesRes.json();
    console.log('Courses fetched:', coursesData.success, coursesData.courses?.length);
    
    if (coursesData.courses?.length > 0) {
      const courseId = coursesData.courses[0]._id;
      console.log('Got courseId:', courseId);

      const studentsRes = await fetch('http://localhost:5000/api/instructor/course/' + courseId + '/students', {
        headers: { 'Cookie': cookie }
      });
      const studentsText = await studentsRes.text();
      console.log('Students raw text:', studentsText);
    }
  } catch (err) {
    console.error(err);
  }
}
testApi();
