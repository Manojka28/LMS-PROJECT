import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lecture from '../models/Lecture.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import Quiz from '../models/Quiz.js';

const EMPTY_PROGRESS_FOR_ENROLL = {
  completedLectures: [],
  completionPercentage: 0,
  completed: false,
};

const instructorPopulate = { path: 'instructor', select: 'name email role' };
const coursePopulate = [
  instructorPopulate,
  {
    path: 'sections',
    populate: { path: 'lectures' },
  },
];

function canManageCourse(user, course) {
  if (user.role === 'admin') return true;
  if (user.role === 'instructor' && course.instructor.toString() === user._id.toString()) {
    return true;
  }
  return false;
}

function serializeCourse(course, user) {
  const obj = course.toObject();
  obj.enrolledCount = obj.enrolledStudents?.length ?? 0;
  delete obj.enrolledStudents;

  if (user) {
    obj.isEnrolled = user.purchasedCourses?.some(
      (cId) => cId.toString() === course._id.toString()
    );
  }

  const isOwner = user && user.role === 'instructor' && String(obj.instructor?._id) === String(user._id);
  const isAdmin = user && user.role === 'admin';
  const hasFullAccess = isAdmin || isOwner || obj.isEnrolled;

  if (obj.instructor && !hasFullAccess) {
    delete obj.instructor.email;
  }

  // Strip lecture videoUrl and resources if not fully authorized
  if (!hasFullAccess && obj.sections) {
    for (const section of obj.sections) {
      if (section.lectures) {
        for (const lecture of section.lectures) {
          delete lecture.videoUrl;
          delete lecture.resources;
        }
      }
    }
  }

  return obj;
}

async function createSectionsWithLectures(courseId, sectionsInput = []) {
  const sectionIds = [];

  for (const sectionData of sectionsInput) {
    const lectureIds = [];

    if (Array.isArray(sectionData.lectures)) {
      for (const lectureData of sectionData.lectures) {
        const lecture = await Lecture.create({
          title: lectureData.title,
          description: lectureData.description ?? '',
          videoUrl: lectureData.videoUrl,
          duration: lectureData.duration,
          resources: lectureData.resources ?? [],
        });
        lectureIds.push(lecture._id);
      }
    }

    const section = await Section.create({
      title: sectionData.title,
      course: courseId,
      lectures: lectureIds,
    });
    sectionIds.push(section._id);
  }

  return sectionIds;
}

async function deleteCourseContent(course) {
  const sections = await Section.find({ course: course._id });
  const lectureIds = sections.flatMap((s) => s.lectures);

  if (lectureIds.length > 0) {
    await Lecture.deleteMany({ _id: { $in: lectureIds } });
  }
  await Section.deleteMany({ course: course._id });
}

export async function createCourse(req, res, next) {
  try {
    const {
      title,
      subtitle = '',
      description,
      thumbnail = '',
      price,
      category,
      level,
      sections = [],
    } = req.body;

    const instructorId =
      req.user.role === 'admin' && req.body.instructor ? req.body.instructor : req.user._id;

    const course = await Course.create({
      title,
      subtitle,
      description,
      thumbnail,
      price,
      category,
      level,
      instructor: instructorId,
    });

    const sectionIds = await createSectionsWithLectures(course._id, sections);
    if (sectionIds.length > 0) {
      course.sections = sectionIds;
      await course.save();
    }

    const populated = await Course.findById(course._id).populate(coursePopulate);
    res.status(201).json({ success: true, course: serializeCourse(populated, req.user) });
  } catch (err) {
    next(err);
  }
}

export async function getCourses(req, res, next) {
  try {
    const filter = {};
    if (!req.user || req.user.role === 'student') {
      filter.isPublished = true;
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.instructor) {
      if (!mongoose.isValidObjectId(req.query.instructor)) {
        return res.status(400).json({ success: false, message: 'Invalid instructor ID' });
      }
      filter.instructor = req.query.instructor;
    }

    const courses = await Course.find(filter)
      .populate(instructorPopulate)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((course) => serializeCourse(course, req.user)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getCourseById(req, res, next) {
  try {
    const course = await Course.findById(req.params.id).populate(coursePopulate);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const serialized = serializeCourse(course, req.user);
    
    // If the user is an instructor/admin, attach hasQuiz to each lecture
    if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
      const quizzes = await Quiz.find({ course: course._id }).select('lecture').lean();
      const quizLectureIds = new Set(quizzes.map(q => q.lecture.toString()));
      if (serialized.sections) {
        serialized.sections.forEach(section => {
          if (section.lectures) {
            section.lectures.forEach(lecture => {
              lecture.hasQuiz = quizLectureIds.has(lecture._id.toString());
            });
          }
        });
      }
    }

    res.json({ success: true, course: serialized });
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }

    const allowedFields = [
      'title',
      'subtitle',
      'description',
      'thumbnail',
      'price',
      'category',
      'level',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    }

    if (req.user.role === 'admin' && req.body.instructor !== undefined) {
      course.instructor = req.body.instructor;
    }

    if (Array.isArray(req.body.sections)) {
      await deleteCourseContent(course);
      const sectionIds = await createSectionsWithLectures(course._id, req.body.sections);
      course.sections = sectionIds;
    }

    await course.save();

    const populated = await Course.findById(course._id).populate(coursePopulate);
    
    // Check if sections changed/added to notify enrolled students
    if (Array.isArray(req.body.sections) && course.enrolledStudents && course.enrolledStudents.length > 0) {
      const notifs = course.enrolledStudents.map(studentId => ({
        userId: studentId,
        type: 'NEW_LECTURE_ADDED',
        title: 'Course Updated',
        message: `New content has been added to ${course.title}.`,
        link: `/courses/${course._id}`
      }));
      await Notification.insertMany(notifs);
    }

    res.json({ success: true, course: serializeCourse(populated, req.user) });
  } catch (err) {
    next(err);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    await deleteCourseContent(course);
    await Progress.deleteMany({ course: course._id });
    await Wishlist.deleteMany({ course: course._id });
    await User.updateMany(
      { purchasedCourses: course._id },
      { $pull: { purchasedCourses: course._id } }
    );
    await Course.findByIdAndDelete(course._id);

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function enrollInCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const userId = req.user._id;
    const courseId = course._id;

    const alreadyEnrolled = req.user.purchasedCourses.some(
      (cId) => cId.toString() === courseId.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { purchasedCourses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: userId } });
    await Progress.findOneAndUpdate(
      { user: userId, course: courseId },
      { $setOnInsert: { ...EMPTY_PROGRESS_FOR_ENROLL } },
      { upsert: true }
    );

    await Notification.create({
      userId: userId,
      type: 'COURSE_ENROLLED',
      title: 'Course Enrolled',
      message: `You are now enrolled in ${course.title}.`,
      link: `/courses/${courseId}`
    });

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    next(err);
  }
}

export async function publishCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    course.isPublished = true;
    await course.save();

    // Notify all students
    const students = await User.find({ role: 'student' }).select('_id');
    if (students.length > 0) {
      const notifs = students.map(student => ({
        userId: student._id,
        type: 'NEW_COURSE_PUBLISHED',
        title: 'New Course Published',
        message: `${course.title} is now available!`,
        link: `/courses/${course._id}`
      }));
      await Notification.insertMany(notifs);
    }

    res.json({ success: true, message: 'Course published successfully', course: serializeCourse(course, req.user) });
  } catch (err) {
    next(err);
  }
}

export async function unpublishCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    course.isPublished = false;
    await course.save();

    res.json({ success: true, message: 'Course unpublished successfully', course: serializeCourse(course, req.user) });
  } catch (err) {
    next(err);
  }
}

async function recalculateCourseRating(courseId) {
  const result = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);

  if (result.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].totalReviews
    });
  } else {
    await Course.findByIdAndUpdate(courseId, { rating: 0, totalReviews: 0 });
  }
}

export async function getCourseReviews(req, res, next) {
  try {
    const reviews = await Review.find({ course: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
}

export async function addReview(req, res, next) {
  try {
    const { rating, review } = req.body;
    const courseId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const isEnrolled = req.user.purchasedCourses?.some((c) => c.toString() === courseId.toString());
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'Only enrolled students can leave a review' });
    }

    const existingReview = await Review.findOne({ user: userId, course: courseId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this course' });
    }

    const newReview = await Review.create({
      user: userId,
      course: courseId,
      rating: Number(rating),
      review
    });

    await recalculateCourseRating(courseId);

    await newReview.populate('user', 'name');
    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req, res, next) {
  try {
    const { rating, review } = req.body;
    const courseId = req.params.id;
    const userId = req.user._id;

    const existingReview = await Review.findOne({ user: userId, course: courseId });
    if (!existingReview) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (rating !== undefined) existingReview.rating = Number(rating);
    if (review !== undefined) existingReview.review = review;

    await existingReview.save();
    await recalculateCourseRating(courseId);

    await existingReview.populate('user', 'name');
    res.json({ success: true, review: existingReview });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;

    const existingReview = await Review.findOne({ user: userId, course: courseId });
    if (!existingReview) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await existingReview.deleteOne();
    await recalculateCourseRating(courseId);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
}
