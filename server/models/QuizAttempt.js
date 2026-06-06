import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lecture: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    isPassed: { type: Boolean, required: true, default: false },
    answers: [{ type: Number }], // Array of selected option indices
  },
  { timestamps: true } // Attempt date is managed by timestamps
);

quizAttemptSchema.index({ student: 1, course: 1 });
quizAttemptSchema.index({ student: 1, quiz: 1 });
quizAttemptSchema.index({ course: 1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
