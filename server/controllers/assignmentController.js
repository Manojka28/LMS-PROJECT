import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getAssignment(req, res, next) {
  try {
    const { lectureId } = req.params;
    const assignment = await Assignment.findOne({ lecture: lectureId });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    let submission = null;
    if (req.user && req.user.role === 'student') {
      submission = await AssignmentSubmission.findOne({ 
        assignment: assignment._id, 
        student: req.user._id 
      });
    }

    res.json({ success: true, assignment, submission });
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(req, res, next) {
  try {
    const { title, description, dueDate, maxMarks, attachmentUrl, lectureId, courseId } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const assignment = new Assignment({
      title, description, dueDate, maxMarks, attachmentUrl,
      lecture: lectureId, course: courseId, instructor: req.user._id
    });

    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
}

export async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    
    if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(assignment, req.body);
    await assignment.save();
    res.json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Optional: Delete physical files associated with submissions
    const submissions = await AssignmentSubmission.find({ assignment: id });
    for (const sub of submissions) {
      if (sub.submissionUrl) {
        const filePath = path.join(__dirname, '../../', sub.submissionUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await AssignmentSubmission.deleteMany({ assignment: id });
    await assignment.deleteOne();

    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
}

export async function submitAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    console.log('[Upload Backend] req.body:', req.body);
    console.log('[Upload Backend] req.file:', req.file);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Must be .pdf or .zip' });
    }

    const fileUrl = `/uploads/assignments/${req.file.filename}`;
    const originalFilename = req.file.originalname;

    let submission = await AssignmentSubmission.findOne({ assignment: id, student: req.user._id });

    if (submission) {
      // Delete old file
      if (submission.submissionUrl) {
        const oldFilePath = path.join(__dirname, '../../', submission.submissionUrl);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      
      submission.submissionUrl = fileUrl;
      submission.originalFilename = originalFilename;
      submission.status = 'Pending';
      submission.marks = undefined;
      submission.feedback = undefined;
      await submission.save();
    } else {
      submission = new AssignmentSubmission({
        student: req.user._id,
        assignment: id,
        course: assignment.course,
        lecture: assignment.lecture,
        submissionUrl: fileUrl,
        originalFilename
      });
      await submission.save();
    }

    await Notification.create({
      userId: assignment.instructor,
      type: 'ASSIGNMENT_SUBMITTED',
      title: 'Assignment Submitted',
      message: `${req.user.name} submitted the assignment "${assignment.title}".`,
      link: `/instructor/dashboard`
    });

    res.status(201).json({ success: true, submission });
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentSubmissions(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await AssignmentSubmission.find({ assignment: id })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
}

export async function gradeSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const { marks, feedback } = req.body;
    
    const submission = await AssignmentSubmission.findById(id).populate('assignment');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (req.user.role !== 'admin' && submission.assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = 'Reviewed';
    await submission.save();

    await Notification.create({
      userId: submission.student,
      type: 'ASSIGNMENT_GRADED',
      title: 'Assignment Graded',
      message: `Your assignment "${submission.assignment.title}" has been graded.`,
      link: `/student/assignments`
    });

    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
}
