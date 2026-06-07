import express from 'express';
const app = express();

app.get('/api/certificate/:courseId', (req, res) => res.send('getCertificate'));
app.get('/api/certificate/:courseId/download', (req, res) => res.send('downloadCertificate'));

const server = app.listen(0, async () => {
  const port = server.address().port;
  const res = await fetch(`http://localhost:${port}/api/certificate/123/download`);
  const text = await res.text();
  console.log("Matched route:", text);
  server.close();
  process.exit(0);
});
