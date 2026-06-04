import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lecture from '../models/Lecture.js';

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
    res.status(201).json({ success: true, course: populated });
  } catch (err) {
    next(err);
  }
}

export async function getCourses(req, res, next) {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.instructor) filter.instructor = req.query.instructor;

    const courses = await Course.find(filter)
      .populate(instructorPopulate)
      .sort({ createdAt: -1 });

    res.json({ success: true, count: courses.length, courses });
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

    res.json({ success: true, course });
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
      'rating',
      'totalReviews',
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
    res.json({ success: true, course: populated });
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

    const user = req.user; // attachUser provides full user from DB

    // Prevent duplicate enrollment
    const isEnrolled = user.purchasedCourses.some(
      (cId) => cId.toString() === course._id.toString()
    );

    if (isEnrolled) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    // Add course to user
    user.purchasedCourses.push(course._id);
    await user.save();

    // Add user to course
    course.enrolledStudents.push(user._id);
    await course.save();

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    next(err);
  }
}
