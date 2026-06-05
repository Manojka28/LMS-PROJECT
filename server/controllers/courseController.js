import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lecture from '../models/Lecture.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';

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

    res.json({ success: true, course: serializeCourse(course, req.user) });
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
