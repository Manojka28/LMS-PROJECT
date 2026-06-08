const express = require('express');
const app = express();

app.get('/api/certificate/:courseId', (req, res) => res.send('getCertificate'));
app.get('/api/certificate/:courseId/download', (req, res) => res.send('downloadCertificate'));

const request = require('supertest');

request(app)
  .get('/api/certificate/123/download')
  .end((err, res) => {
    console.log("Matched route:", res.text);
    process.exit(0);
  });
