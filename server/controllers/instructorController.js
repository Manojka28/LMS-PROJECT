import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Review from '../models/Review.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Order from '../models/Order.js';
import Wishlist from '../models/Wishlist.js';
import Certificate from '../models/Certificate.js';

export async function getDashboardAnalytics(req, res, next) {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId });

    let totalCourses = courses.length;
    let publishedCourses = 0;
    let draftCourses = 0;
    let totalEnrollments = 0;
    const uniqueStudents = new Set();

    courses.forEach(course => {
      if (course.isPublished) publishedCourses++;
      else draftCourses++;

      if (course.enrolledStudents) {
        totalEnrollments += course.enrolledStudents.length;
        course.enrolledStudents.forEach(studentId => uniqueStudents.add(studentId.toString()));
      }
    });

    const courseIds = courses.map(c => c._id);
    const orders = await Order.find({ 
      courseId: { $in: courseIds },
      status: 'Successful'
    });

    let totalRevenue = 0;
    let monthlyRevenue = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const revenuePerCourseMap = {};
    const revenueData = { daily: 0, weekly: 0, monthly: monthlyRevenue };
    const enrollmentData = { daily: 0, weekly: 0, monthly: 0 };
    
    // Revenue and Enrollment Trends over last 30 days
    const revenueTrends = [];
    const enrollmentTrends = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revenueTrends.push({ date: dateStr, amount: 0 });
      enrollmentTrends.push({ date: dateStr, count: 0 });
    }

    orders.forEach(order => {
      totalRevenue += order.amount;
      const pDate = new Date(order.createdAt);
      const dateStr = pDate.toISOString().split('T')[0];
      const timeDiff = now - pDate;
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (daysDiff <= 1) revenueData.daily += order.amount;
      if (daysDiff <= 7) revenueData.weekly += order.amount;
      if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
        // already counted monthlyRevenue
      }

      const revTrend = revenueTrends.find(r => r.date === dateStr);
      if (revTrend) revTrend.amount += order.amount;

      const cId = order.courseId.toString();
      if (!revenuePerCourseMap[cId]) {
        const cTitle = courses.find(c => c._id.toString() === cId)?.title || 'Unknown Course';
        revenuePerCourseMap[cId] = { courseId: cId, courseTitle: cTitle, revenue: 0, paidEnrollments: 0 };
      }
      revenuePerCourseMap[cId].revenue += order.amount;
      revenuePerCourseMap[cId].paidEnrollments += 1;
    });

    const progresses = await Progress.find({ course: { $in: courseIds } });
    let totalCompletions = 0;
    progresses.forEach(p => {
      const pDate = new Date(p.createdAt);
      const dateStr = pDate.toISOString().split('T')[0];
      const timeDiff = now - pDate;
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (daysDiff <= 1) enrollmentData.daily++;
      if (daysDiff <= 7) enrollmentData.weekly++;
      if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) enrollmentData.monthly++;

      const enrTrend = enrollmentTrends.find(e => e.date === dateStr);
      if (enrTrend) enrTrend.count++;

      if (p.completed) totalCompletions++;
    });

    const completionRate = progresses.length > 0 ? Math.round((totalCompletions / progresses.length) * 100) : 0;

    // Quiz and Assignment performance averages
    const quizAttempts = await QuizAttempt.find({ course: { $in: courseIds } }).lean();
    const sumQuiz = quizAttempts.reduce((acc, q) => acc + q.percentage, 0);
    const avgQuizScore = quizAttempts.length > 0 ? Math.round(sumQuiz / quizAttempts.length) : 0;

    const assignments = await AssignmentSubmission.find({ course: { $in: courseIds }, status: 'Reviewed' }).lean();
    const sumAssign = assignments.reduce((acc, a) => acc + a.marks, 0);
    const avgAssignmentScore = assignments.length > 0 ? Math.round(sumAssign / assignments.length) : 0;

    const revenuePerCourse = Object.values(revenuePerCourseMap).sort((a, b) => b.revenue - a.revenue);

    const wishlistStats = await Wishlist.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseData' } },
      { $unwind: '$courseData' },
      { $project: { _id: 1, count: 1, title: '$courseData.title' } }
    ]);

    const totalWishlists = await Wishlist.countDocuments({ course: { $in: courseIds } });
    const totalCertificatesIssued = await Certificate.countDocuments({ courseId: { $in: courseIds } });

    res.json({
      success: true,
      analytics: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
        totalStudents: uniqueStudents.size,
        totalRevenue,
        monthlyRevenue,
        revenueData,
        enrollmentData,
        revenueTrends,
        enrollmentTrends,
        completionRate,
        avgQuizScore,
        avgAssignmentScore,
        revenuePerCourse,
        totalWishlists,
        topWishlistedCourses: wishlistStats,
        totalCertificatesIssued
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getInstructorCourses(req, res, next) {
  try {
    const instructorId = req.user._id;
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;

    const query = { instructor: instructorId };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({ path: 'instructor', select: 'name email role' })
      .lean();

    const mappedCourses = courses.map(course => {
      course.enrolledCount = course.enrolledStudents?.length || 0;
      delete course.enrolledStudents;
      return course;
    });

    res.json({
      success: true,
      count: mappedCourses.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      courses: mappedCourses
    });

  } catch (err) {
    next(err);
  }
}

export async function getCourseStudents(req, res, next) {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Not authorized to view students for this course' });
    }

    const progresses = await Progress.find({ course: courseId })
      .populate('user', 'name email')
      .lean();

    const students = progresses.map(p => ({
      _id: p.user?._id,
      name: p.user?.name || 'Unknown User',
      email: p.user?.email || 'Unknown Email',
      completionPercentage: p.completionPercentage || 0,
      completedLectures: p.completedLectures?.length || 0,
      enrollmentDate: p.createdAt
    }));

    res.json({
      success: true,
      totalStudents: students.length,
      students
    });
  } catch (err) {
    next(err);
  }
}

export async function getCourseReviewsForInstructor(req, res, next) {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Not authorized to view reviews for this course' });
    }

    const reviews = await Review.find({ course: courseId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      totalReviews: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
}

export async function getCourseQuizAnalytics(req, res, next) {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Not authorized to view analytics for this course' });
    }

    const attempts = await QuizAttempt.find({ course: courseId })
      .populate('student', 'name email')
      .populate('lecture', 'title')
      .sort({ createdAt: -1 })
      .lean();

    let totalAttempts = attempts.length;
    let avgScore = 0;
    let highestScore = 0;
    let passedAttempts = 0;
    let failedAttempts = 0;

    if (totalAttempts > 0) {
      const sumPercentages = attempts.reduce((acc, a) => {
        if (a.isPassed) passedAttempts++;
        else failedAttempts++;
        return acc + a.percentage;
      }, 0);
      avgScore = Math.round(sumPercentages / totalAttempts);
      highestScore = Math.max(...attempts.map(a => a.percentage));
    }

    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const failRate = totalAttempts > 0 ? 100 - passRate : 0;

    res.json({
      success: true,
      analytics: {
        totalAttempts,
        averageScore: avgScore,
        highestScore,
        passRate,
        failRate,
        attempts
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCourseAssignmentAnalytics(req, res, next) {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Not authorized to view analytics for this course' });
    }

    const assignments = await Assignment.find({ course: courseId }).lean();
    const submissions = await AssignmentSubmission.find({ course: courseId })
      .populate('student', 'name email')
      .populate('assignment', 'title')
      .sort({ createdAt: -1 })
      .lean();

    let totalSubmissions = submissions.length;
    let pendingReviews = 0;
    let reviewedCount = 0;
    let avgMarks = 0;
    let highestMarks = 0;
    let lowestMarks = 0;
    let totalMarks = 0;

    if (totalSubmissions > 0) {
      submissions.forEach(sub => {
        if (sub.status === 'Pending') {
          pendingReviews++;
        } else if (sub.status === 'Reviewed' && sub.marks !== undefined) {
          reviewedCount++;
          totalMarks += sub.marks;
          if (sub.marks > highestMarks) highestMarks = sub.marks;
          if (lowestMarks === 0 || sub.marks < lowestMarks) lowestMarks = sub.marks;
        }
      });
      
      if (reviewedCount > 0) {
        avgMarks = Math.round(totalMarks / reviewedCount);
      }
    }

    res.json({
      success: true,
      analytics: {
        totalAssignments: assignments.length,
        totalSubmissions,
        pendingReviews,
        reviewedCount,
        averageMarks: avgMarks,
        highestMarks,
        lowestMarks,
        submissions
      }
    });
  } catch (err) {
    next(err);
  }
}
