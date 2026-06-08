import mongoose from 'mongoose';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import Section from '../models/Section.js';

const EMPTY_PROGRESS = {
  completedLectures: [],
  completionPercentage: 0,
  completed: false,
};

function isEnrolled(user, courseId) {
  return user.purchasedCourses?.some((cId) => cId.toString() === courseId.toString());
}

export async function checkAndMarkCourseComplete(studentId, courseId) {
  const progress = await Progress.findOne({ user: studentId, course: courseId });
  if (!progress || progress.completed) return;

  if (progress.completionPercentage < 100) return;

  const { checkEligibility } = await import('./certificateController.js');
  const eligibility = await checkEligibility(studentId, courseId);
  
  if (eligibility.isEligible) {
    progress.completed = true;
    await progress.save();

    try {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({
        userId: studentId,
        title: 'Course Completed!',
        message: `Congratulations! You have completed all course requirements.`,
        type: 'course_completion',
        link: `/course/${courseId}/player`
      });
    } catch (err) {
      console.error('Failed to create completion notification:', err);
    }
  }
}

async function getCourseLectureIds(courseId) {
  const sections = await Section.find({ course: courseId }).select('lectures');
  const ids = new Set();
  for (const section of sections) {
    for (const lectureId of section.lectures) {
      ids.add(lectureId.toString());
    }
  }
  return ids;
}

function emptyProgressResponse(userId, courseId) {
  return {
    user: userId,
    course: courseId,
    ...EMPTY_PROGRESS,
  };
}

export async function completeLecture(req, res, next) {
  try {
    const { courseId, lectureId } = req.body;

    if (!isEnrolled(req.user, courseId)) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const lectureIds = await getCourseLectureIds(courseId);
    if (!lectureIds.size) {
      return res.status(400).json({ success: false, message: 'Course has no lectures' });
    }

    if (!lectureIds.has(lectureId.toString())) {
      return res.status(400).json({ success: false, message: 'Lecture does not belong to this course' });
    }

    const totalLectures = lectureIds.size;

    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) {
      progress = new Progress({ user: req.user._id, course: courseId });
    }

    const isCompleted = progress.completedLectures.some(
      (id) => id.toString() === lectureId.toString()
    );

    if (!isCompleted) {
      progress.completedLectures.push(lectureId);
    }

    progress.lastViewedLecture = lectureId;
    progress.completionPercentage = Math.min(
      Math.round((progress.completedLectures.length / totalLectures) * 100),
      100
    );

    await progress.save();

    // Verify all requirements (quizzes, assignments)
    await checkAndMarkCourseComplete(req.user._id, courseId);

    // Re-fetch progress to return the latest state
    const updatedProgress = await Progress.findOne({ user: req.user._id, course: courseId });

    res.json({ success: true, progress: updatedProgress });
  } catch (err) {
    next(err);
  }
}

export async function updateLastViewed(req, res, next) {
  try {
    const { courseId, lectureId } = req.body;

    if (!isEnrolled(req.user, courseId)) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const lectureIds = await getCourseLectureIds(courseId);
    if (!lectureIds.has(lectureId.toString())) {
      return res.status(400).json({ success: false, message: 'Lecture does not belong to this course' });
    }

    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) {
      progress = new Progress({ user: req.user._id, course: courseId });
    }

    progress.lastViewedLecture = lectureId;
    await progress.save();

    res.json({ success: true, progress });
  } catch (err) {
    next(err);
  }
}

export async function getCourseProgress(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    if (!isEnrolled(req.user, courseId)) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const progress = await Progress.findOne({
      user: req.user._id,
      course: courseId,
    });

    res.json({
      success: true,
      progress: progress ?? emptyProgressResponse(req.user._id, courseId),
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllProgress(req, res, next) {
  try {
    const progress = await Progress.find({ user: req.user._id }).populate('course', 'title thumbnail');
    res.json({ success: true, progress });
  } catch (err) {
    next(err);
  }
}
