import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Notification from '../models/Notification.js';

export async function getQuiz(req, res, next) {
  try {
    const { lectureId } = req.params;
    const quiz = await Quiz.findOne({ lecture: lectureId }).lean();

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'No quiz found for this lecture' });
    }

    const course = await Course.findById(quiz.course);
    const isInstructor = req.user.role === 'instructor' && course && course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isOwner = isInstructor || isAdmin;

    if (!isOwner) {
      // Strip answers and explanations for students
      quiz.questions = quiz.questions.map(q => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    res.json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
}

export async function createQuiz(req, res, next) {
  try {
    const { courseId, lectureId, questions } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const isInstructor = req.user.role === 'instructor' && course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const existingQuiz = await Quiz.findOne({ lecture: lectureId });
    if (existingQuiz) {
      return res.status(400).json({ message: 'Quiz already exists for this lecture' });
    }

    const quiz = await Quiz.create({
      course: courseId,
      lecture: lectureId,
      questions
    });

    res.status(201).json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const { quizId } = req.params;
    const { questions } = req.body;

    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isInstructor = req.user.role === 'instructor' && quiz.course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    quiz.questions = questions;
    await quiz.save();

    res.json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isInstructor = req.user.role === 'instructor' && quiz.course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await QuizAttempt.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);

    res.json({ success: true, message: 'Quiz deleted' });
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req, res, next) {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of selected option indices

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Ensure student is enrolled
    const isEnrolled = req.user.purchasedCourses?.some(cId => cId.toString() === quiz.course.toString());
    if (!isEnrolled) {
      return res.status(403).json({ message: 'Must be enrolled to take the quiz' });
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;
    const results = [];

    quiz.questions.forEach((q, idx) => {
      const studentAnswer = answers[idx];
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) score++;
      results.push({
        questionId: q._id,
        isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      });
    });

    const percentage = Math.round((score / totalQuestions) * 100);
    const isPassed = percentage >= 80;

    const attempt = await QuizAttempt.create({
      student: req.user._id,
      quiz: quizId,
      course: quiz.course,
      lecture: quiz.lecture,
      score,
      totalQuestions,
      percentage,
      isPassed,
      answers
    });

    await Progress.findOneAndUpdate(
      { user: req.user._id, course: quiz.course },
      { $addToSet: { completedLectures: quiz.lecture } },
      { new: true }
    );

    await Notification.create({
      userId: req.user._id,
      type: 'QUIZ_GRADED',
      title: 'Quiz Graded',
      message: `Your quiz "${quiz.title}" has been graded. Score: ${score}/${quiz.questions.length}`,
      link: `/courses/${quiz.course}/lecture/${quiz.lecture}`
    });

    const course = await Course.findById(quiz.course);
    if (course && course.instructor) {
      await Notification.create({
        userId: course.instructor,
        type: 'QUIZ_SUBMITTED',
        title: 'Quiz Submitted',
        message: `${req.user.name} submitted the quiz "${quiz.title}".`,
        link: `/instructor/dashboard`
      });
    }

    res.json({
      success: true,
      score,
      totalQuestions,
      percentage,
      isPassed,
      results
    });
  } catch (err) {
    next(err);
  }
}

export async function getQuizResults(req, res, next) {
  try {
    const { quizId } = req.params;
    
    const attempts = await QuizAttempt.find({ quiz: quizId, student: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!attempts || attempts.length === 0) {
      return res.json({ success: true, hasAttempted: false });
    }

    // Find best score
    const bestAttempt = [...attempts].sort((a, b) => b.score - a.score)[0];
    const latestAttempt = attempts[0];

    res.json({
      success: true,
      hasAttempted: true,
      attempts: attempts.length,
      bestScore: bestAttempt.score,
      bestPercentage: bestAttempt.percentage,
      latestScore: latestAttempt.score,
      latestPercentage: latestAttempt.percentage,
      lastAttempt: latestAttempt
    });
  } catch (err) {
    next(err);
  }
}
