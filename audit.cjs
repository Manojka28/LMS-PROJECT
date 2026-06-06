const mongoose = require('mongoose');
require('dotenv').config();
const Quiz = require('./server/models/Quiz.js').default;
const Lecture = require('./server/models/Lecture.js').default;

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const quizzes = await Quiz.find().lean();
    const lectures = await Lecture.find().lean();
    console.log("Total Quizzes: " + quizzes.length);
    console.log("Total Lectures: " + lectures.length);
    console.log('--- QUIZZES ---');
    quizzes.forEach(q => console.log("quizId: " + q._id + ", lectureId: " + q.lecture + ", title: " + (q.title || 'N/A')));
    console.log('--- MAPPING ---');
    let missing = [];
    lectures.forEach(l => {
      const hasQuiz = quizzes.some(q => q.lecture.toString() === l._id.toString());
      console.log("Lecture: " + l.title + " | ID: " + l._id + " | Quiz Exists: " + (hasQuiz ? 'Yes' : 'No'));
      if (!hasQuiz) missing.push(l.title);
    });
    console.log('--- COVERAGE ---');
    console.log("Coverage: " + ((quizzes.length / lectures.length) * 100).toFixed(2) + "%");
    console.log("Missing Lectures Count: " + missing.length);
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
});
