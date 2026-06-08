import mongoose from 'mongoose';

const learningSessionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' },
    sessionStart: { type: Date, required: true },
    sessionEnd: { type: Date, required: true },
    durationSeconds: { type: Number, required: true, default: 0 },
    dateString: { type: String, required: true } // YYYY-MM-DD for fast grouping
  },
  { timestamps: true }
);

// Indexes for fast aggregation
learningSessionSchema.index({ studentId: 1, dateString: 1 });
learningSessionSchema.index({ studentId: 1, courseId: 1 });

export default mongoose.model('LearningSession', learningSessionSchema);
