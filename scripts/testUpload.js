import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
  try {
    // 1. Login as student
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@test.com', password: 'password123' })
    });
    
    const cookieHeader = loginRes.headers.get('set-cookie');
    const tokenCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
    console.log('Got cookie:', tokenCookie);

    // 2. Get the course list to find an assignment
    const coursesRes = await fetch('http://localhost:5000/api/student/courses', {
      headers: { 'Cookie': tokenCookie }
    });
    const coursesData = await coursesRes.json();
    const courseId = coursesData.courses[0].course._id;

    // fetch course details
    const courseDetailRes = await fetch(`http://localhost:5000/api/course/${courseId}`, {
      headers: { 'Cookie': tokenCookie }
    });
    const courseDetail = await courseDetailRes.json();
    const lectureId = courseDetail.course.sections[0].lectures[0]._id;

    // 3. Get the assignment
    const assignRes = await fetch(`http://localhost:5000/api/assignment/${lectureId}`, {
      headers: { 'Cookie': tokenCookie }
    });
    const assignData = await assignRes.json();
    const assignmentId = assignData.assignment._id;
    console.log('Assignment ID:', assignmentId);

    // 4. Create a dummy PDF
    const pdfPath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(pdfPath, 'dummy pdf content');

    // 5. Upload via multipart/form-data
    const fileStats = fs.statSync(pdfPath);
    const fileStream = fs.createReadStream(pdfPath);
    
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    const bodyStart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`
    );
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
    
    const fileBuffer = fs.readFileSync(pdfPath);
    const finalBody = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

    const uploadRes = await fetch(`http://localhost:5000/api/assignment/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'Cookie': tokenCookie,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: finalBody
    });

    const uploadData = await uploadRes.json();
    console.log('Upload Result:', uploadData);

    fs.unlinkSync(pdfPath);

  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testUpload();
