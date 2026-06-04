import Progress from '../models/Progress.js';
import Course from '../models/Course.js';

export async function completeLecture(req, res, next) {
  try {
    const { courseId, lectureId } = req.body;
    if (!courseId || !lectureId) {
      return res.status(400).json({ success: false, message: 'courseId and lectureId are required' });
    }

    const course = await Course.findById(courseId).populate('sections');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Calculate total lectures
    let totalLectures = 0;
    for (const section of course.sections) {
      totalLectures += section.lectures.length;
    }

    // Upsert progress
    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) {
      progress = new Progress({ user: req.user._id, course: courseId });
    }

    // Prevent duplicates
    const isCompleted = progress.completedLectures.some(
      (id) => id.toString() === lectureId.toString()
    );

    if (!isCompleted) {
      progress.completedLectures.push(lectureId);
    }

    progress.lastViewedLecture = lectureId;

    if (totalLectures > 0) {
      progress.completionPercentage = Math.min(
        Math.round((progress.completedLectures.length / totalLectures) * 100),
        100
      );
    } else {
      progress.completionPercentage = 100;
    }

    if (progress.completionPercentage === 100) {
      progress.completed = true;
    }

    await progress.save();

    res.json({ success: true, progress });
  } catch (err) {
    next(err);
  }
}

export async function updateLastViewed(req, res, next) {
  try {
    const { courseId, lectureId } = req.body;
    if (!courseId || !lectureId) {
      return res.status(400).json({ success: false, message: 'courseId and lectureId are required' });
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
    const progress = await Progress.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });

    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress not found' });
    }

    res.json({ success: true, progress });
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
