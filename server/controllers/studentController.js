import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import AIQuizAttempt from '../models/AIQuizAttempt.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Wishlist from '../models/Wishlist.js';
import Certificate from '../models/Certificate.js';
import LearningSession from '../models/LearningSession.js';

export async function postLearningHeartbeat(req, res, next) {
  try {
    const { courseId, lectureId, durationSeconds } = req.body;
    const studentId = req.user._id;

    if (!courseId) return res.status(400).json({ success: false, message: 'Course ID required' });

    const validDuration = Math.min(Number(durationSeconds) || 30, 60);
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    let session = await LearningSession.findOne({ studentId, courseId, dateString });

    if (session) {
      session.durationSeconds += validDuration;
      session.sessionEnd = today;
      await session.save();
    } else {
      session = new LearningSession({
        studentId,
        courseId,
        lectureId,
        sessionStart: today,
        sessionEnd: today,
        durationSeconds: validDuration,
        dateString
      });
      await session.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ success: false });
  }
}

export async function getDashboardAnalytics(req, res, next) {
  try {
    const studentId = req.user._id;

    const progressDocs = await Progress.find({ user: studentId });
    const certificatesCount = await Certificate.countDocuments({ userId: studentId });
    const quizAttempts = await QuizAttempt.find({ student: studentId }).sort({ createdAt: 1 });
    const aiQuizAttempts = await AIQuizAttempt.find({ studentId }).sort({ createdAt: 1 });
    const assignmentSubmissions = await AssignmentSubmission.find({ student: studentId }).sort({ createdAt: 1 });
    const sessions = await LearningSession.find({ studentId }).sort({ dateString: 1 });

    const totalEnrolled = progressDocs.length;
    const completedCourses = progressDocs.filter(p => p.completed).length;
    
    let totalPercentage = 0;
    progressDocs.forEach(p => {
      totalPercentage += p.completionPercentage;
    });
    const averageProgress = totalEnrolled > 0 ? Math.round(totalPercentage / totalEnrolled) : 0;

    let totalSeconds = 0;
    const dateMap = {}; 
    sessions.forEach(s => {
      totalSeconds += s.durationSeconds;
      dateMap[s.dateString] = (dateMap[s.dateString] || 0) + s.durationSeconds;
    });
    
    const hoursStudied = Math.round((totalSeconds / 3600) * 10) / 10;

    let learningStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const uniqueDates = Object.keys(dateMap).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()); 
    
    if (uniqueDates.length > 0) {
      let currentDate = new Date(todayStr);
      let streakCount = 0;
      let checkStr = todayStr;
      
      if (!dateMap[todayStr]) {
        currentDate.setDate(currentDate.getDate() - 1);
        checkStr = currentDate.toISOString().split('T')[0];
      }

      while (dateMap[checkStr]) {
        streakCount++;
        currentDate.setDate(currentDate.getDate() - 1);
        checkStr = currentDate.toISOString().split('T')[0];
      }
      learningStreak = streakCount;
    }

    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const sec = dateMap[ds] || 0;
      weeklyProgress.push({ name: dayName, hours: Math.round((sec / 3600) * 10) / 10 });
    }

    const monthlyProgress = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const sec = dateMap[ds] || 0;
      monthlyProgress.push({ name: dayName, hours: Math.round((sec / 3600) * 10) / 10 });
    }

    let mostActiveDay = { date: '-', hours: 0 };
    let maxSec = 0;
    for (const [ds, sec] of Object.entries(dateMap)) {
      if (sec > maxSec) {
        maxSec = sec;
        mostActiveDay = { date: ds, hours: Math.round((sec / 3600) * 10) / 10 };
      }
    }

    const combinedQuizzes = [
      ...quizAttempts.map(q => ({ date: q.createdAt, score: q.percentage, type: 'Instructor' })), 
      ...aiQuizAttempts.map(q => ({ date: q.createdAt, score: q.percentage, type: 'AI Tutor' }))
    ];
    combinedQuizzes.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let totalQuizScore = 0;
    combinedQuizzes.forEach(q => totalQuizScore += q.score);
    const averageQuizScore = combinedQuizzes.length > 0 ? Math.round(totalQuizScore / combinedQuizzes.length) : 0;

    const quizTrends = combinedQuizzes.map((q, idx) => ({
      name: `Q${idx + 1}`,
      score: q.score,
      type: q.type
    }));

    const assignmentTrends = assignmentSubmissions.filter(s => s.marks !== undefined).map((s, idx) => ({
      name: `A${idx + 1}`,
      score: s.marks
    }));

    const courseCompletionChart = [
      { name: 'Completed', value: completedCourses },
      { name: 'In Progress', value: totalEnrolled - completedCourses }
    ];

    res.json({
      success: true,
      analytics: {
        totalEnrolled,
        completedCourses,
        averageProgress,
        hoursStudied,
        learningStreak,
        certificatesEarned: certificatesCount,
        weeklyProgress,
        monthlyProgress,
        quizTrends,
        assignmentTrends,
        courseCompletionChart,
        mostActiveDay,
        totalQuizzesTaken: combinedQuizzes.length,
        averageQuizScore
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getEnrolledCourses(req, res, next) {
  try {
    const studentId = req.user._id;
    const progressDocs = await Progress.find({ user: studentId })
      .populate('course')
      .sort({ createdAt: -1 });
    res.json({ success: true, courses: progressDocs });
  } catch (err) {
    next(err);
  }
}

export async function getContinueLearning(req, res, next) {
  try {
    const studentId = req.user._id;
    const recentProgress = await Progress.findOne({ user: studentId })
      .sort({ updatedAt: -1 })
      .populate('course')
      .populate('lastViewedLecture');
    res.json({ success: true, course: recentProgress });
  } catch (err) {
    next(err);
  }
}

export async function getQuizStats(req, res, next) {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id }).lean();
    const aiAttempts = await AIQuizAttempt.find({ studentId: req.user._id }).lean();
    
    const normalizedAttempts = [
      ...attempts,
      ...aiAttempts.map(a => ({ ...a, quiz: a.quizId, isPassed: a.percentage >= 70 }))
    ];

    let totalQuizzesAttempted = 0;
    let avgScore = 0;
    let bestScore = 0;
    let passedQuizzes = 0;
    let failedQuizzes = 0;
    
    if (normalizedAttempts.length > 0) {
      const quizMap = {};
      normalizedAttempts.forEach(a => {
        const qId = a.quiz ? a.quiz.toString() : 'unknown';
        if (!quizMap[qId] || a.percentage > quizMap[qId].percentage) {
          quizMap[qId] = a;
        }
      });
      
      const uniqueQuizzes = Object.keys(quizMap);
      totalQuizzesAttempted = uniqueQuizzes.length;
      
      uniqueQuizzes.forEach(qId => {
        if (quizMap[qId].isPassed) passedQuizzes++;
        else failedQuizzes++;
      });

      const sumPercentages = normalizedAttempts.reduce((acc, a) => acc + a.percentage, 0);
      avgScore = Math.round(sumPercentages / normalizedAttempts.length);
      
      bestScore = Math.max(...normalizedAttempts.map(a => a.percentage));
    }

    res.json({
      success: true,
      stats: {
        totalQuizzesAttempted,
        averageScore: avgScore,
        bestScore,
        passedQuizzes,
        failedQuizzes
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentStats(req, res, next) {
  try {
    const submissions = await AssignmentSubmission.find({ student: req.user._id }).lean();
    let totalSubmitted = submissions.length;
    let pendingReviews = 0;
    let avgMarks = 0;
    let highestMarks = 0;
    
    if (totalSubmitted > 0) {
      let totalMarks = 0;
      let gradedCount = 0;
      submissions.forEach(sub => {
        if (sub.status === 'Pending') {
          pendingReviews++;
        } else if (sub.status === 'Reviewed' && sub.marks !== undefined) {
          gradedCount++;
          totalMarks += sub.marks;
          if (sub.marks > highestMarks) highestMarks = sub.marks;
        }
      });
      if (gradedCount > 0) avgMarks = Math.round(totalMarks / gradedCount);
    }
    res.json({
      success: true,
      stats: { totalSubmitted, pendingReviews, averageMarks: avgMarks, highestMarks }
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleWishlist(req, res, next) {
  try {
    const studentId = req.user._id;
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: 'Course ID is required' });

    const existing = await Wishlist.findOne({ student: studentId, course: courseId });
    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.json({ success: true, isWishlisted: false, message: 'Removed from wishlist' });
    } else {
      await Wishlist.create({ student: studentId, course: courseId });
      return res.json({ success: true, isWishlisted: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, isWishlisted: true, message: 'Already wishlisted' });
    next(err);
  }
}

export async function getWishlist(req, res, next) {
  try {
    const studentId = req.user._id;
    const wishlist = await Wishlist.find({ student: studentId })
      .populate({ path: 'course', populate: { path: 'instructor', select: 'name email' } })
      .sort({ createdAt: -1 });

    const validWishlist = wishlist.filter(item => item.course != null);
    if (validWishlist.length !== wishlist.length) {
      const invalidIds = wishlist.filter(item => item.course == null).map(item => item._id);
      Wishlist.deleteMany({ _id: { $in: invalidIds } }).exec().catch(console.error);
    }

    res.json({ success: true, wishlist: validWishlist });
  } catch (err) {
    next(err);
  }
}
