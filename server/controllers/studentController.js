import Progress from '../models/Progress.js';

export async function getDashboardAnalytics(req, res, next) {
  try {
    const studentId = req.user._id;

    const progressDocs = await Progress.find({ user: studentId });

    const totalEnrolled = progressDocs.length;
    const completedCourses = progressDocs.filter(p => p.completed).length;
    
    let totalPercentage = 0;
    progressDocs.forEach(p => {
      totalPercentage += p.completionPercentage;
    });
    
    const averageProgress = totalEnrolled > 0 ? Math.round(totalPercentage / totalEnrolled) : 0;

    res.json({
      success: true,
      analytics: {
        totalEnrolled,
        completedCourses,
        averageProgress
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
