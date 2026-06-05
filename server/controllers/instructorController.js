import Course from '../models/Course.js';

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

    res.json({
      success: true,
      analytics: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
        totalStudents: uniqueStudents.size
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
