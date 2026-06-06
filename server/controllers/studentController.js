import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Wishlist from '../models/Wishlist.js';
import Certificate from '../models/Certificate.js';

export async function getDashboardAnalytics(req, res, next) {
  try {
    const studentId = req.user._id;

    const progressDocs = await Progress.find({ user: studentId });
    const certificatesCount = await Certificate.countDocuments({ user: studentId });
    const quizAttempts = await QuizAttempt.find({ student: studentId }).sort({ createdAt: 1 });
    const assignmentSubmissions = await AssignmentSubmission.find({ student: studentId }).sort({ createdAt: 1 });

    const totalEnrolled = progressDocs.length;
    const completedCourses = progressDocs.filter(p => p.completed).length;
    
    let totalPercentage = 0;
    let totalCompletedLectures = 0;
    progressDocs.forEach(p => {
      totalPercentage += p.completionPercentage;
      totalCompletedLectures += p.completedLectures ? p.completedLectures.length : 0;
    });
    
    const averageProgress = totalEnrolled > 0 ? Math.round(totalPercentage / totalEnrolled) : 0;
    const hoursStudied = Math.round((totalCompletedLectures * 0.5) + (completedCourses * 2));

    // Weekly progress (mock data for charting based on total progress)
    const weeklyProgress = [
      { name: 'Mon', hours: Math.max(0, hoursStudied / 7 + (Math.random() - 0.5)) },
      { name: 'Tue', hours: Math.max(0, hoursStudied / 7 + (Math.random() - 0.5)) },
      { name: 'Wed', hours: Math.max(0, hoursStudied / 7 + (Math.random() - 0.5)) },
      { name: 'Thu', hours: Math.max(0, hoursStudied / 7 + (Math.random() - 0.5)) },
      { name: 'Fri', hours: Math.max(0, hoursStudied / 7 + (Math.random() - 0.5)) },
      { name: 'Sat', hours: Math.max(0, hoursStudied / 7 + (Math.random() - 0.5)) },
      { name: 'Sun', hours: Math.max(0, hoursStudied / 7 + (Math.random() - 0.5)) },
    ].map(d => ({ ...d, hours: Math.round(d.hours * 10) / 10 }));

    // Quiz score trends
    const quizTrends = quizAttempts.map((q, idx) => ({
      name: `Q${idx + 1}`,
      score: q.percentage
    }));

    // Assignment score trends
    const assignmentTrends = assignmentSubmissions.filter(s => s.marks !== undefined).map((s, idx) => ({
      name: `A${idx + 1}`,
      score: s.marks
    }));

    // Course completion chart
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
        learningStreak: Math.min(7, totalEnrolled + completedCourses), // Basic mock streak
        certificatesEarned: certificatesCount,
        weeklyProgress,
        quizTrends,
        assignmentTrends,
        courseCompletionChart
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

    res.json({
      success: true,
      courses: progressDocs
    });
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

    res.json({
      success: true,
      course: recentProgress
    });
  } catch (err) {
    next(err);
  }
}

export async function getQuizStats(req, res, next) {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id }).lean();
    
    let totalQuizzesAttempted = 0;
    let avgScore = 0;
    let bestScore = 0;
    let passedQuizzes = 0;
    let failedQuizzes = 0;
    
    if (attempts.length > 0) {
      // Group by quiz to find best attempt per quiz
      const quizMap = {};
      attempts.forEach(a => {
        const qId = a.quiz.toString();
        if (!quizMap[qId] || a.percentage > quizMap[qId].percentage) {
          quizMap[qId] = a;
        }
      });
      
      const uniqueQuizzes = Object.keys(quizMap);
      totalQuizzesAttempted = uniqueQuizzes.size || uniqueQuizzes.length;
      
      uniqueQuizzes.forEach(qId => {
        if (quizMap[qId].isPassed) passedQuizzes++;
        else failedQuizzes++;
      });

      const sumPercentages = attempts.reduce((acc, a) => acc + a.percentage, 0);
      avgScore = Math.round(sumPercentages / attempts.length);
      
      bestScore = Math.max(...attempts.map(a => a.percentage));
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
      
      if (gradedCount > 0) {
        avgMarks = Math.round(totalMarks / gradedCount);
      }
    }

    res.json({
      success: true,
      stats: {
        totalSubmitted,
        pendingReviews,
        averageMarks: avgMarks,
        highestMarks
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleWishlist(req, res, next) {
  try {
    const studentId = req.user._id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const existing = await Wishlist.findOne({ student: studentId, course: courseId });

    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.json({ success: true, isWishlisted: false, message: 'Removed from wishlist' });
    } else {
      await Wishlist.create({ student: studentId, course: courseId });
      return res.json({ success: true, isWishlisted: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error, already wishlisted
      return res.json({ success: true, isWishlisted: true, message: 'Already wishlisted' });
    }
    next(err);
  }
}

export async function getWishlist(req, res, next) {
  try {
    const studentId = req.user._id;
    const wishlist = await Wishlist.find({ student: studentId })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    // Filter out null courses (soft-delete protection)
    const validWishlist = wishlist.filter(item => item.course != null);
    
    // If some were orphaned, we can clean them up asynchronously
    if (validWishlist.length !== wishlist.length) {
      const invalidIds = wishlist.filter(item => item.course == null).map(item => item._id);
      Wishlist.deleteMany({ _id: { $in: invalidIds } }).exec().catch(console.error);
    }

    res.json({
      success: true,
      wishlist: validWishlist
    });
  } catch (err) {
    next(err);
  }
}
