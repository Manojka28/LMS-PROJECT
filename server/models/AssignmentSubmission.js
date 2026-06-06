import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lecture: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  submissionUrl: { type: String, required: true }, // URL to local static file or cloud
  originalFilename: { type: String, required: true },
  marks: { type: Number },
  feedback: { type: String },
  status: { type: String, enum: ['Pending', 'Reviewed'], default: 'Pending' }
}, { timestamps: true });

assignmentSubmissionSchema.index({ student: 1, assignment: 1 }, { unique: true });
assignmentSubmissionSchema.index({ course: 1 });

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
export default AssignmentSubmission;
