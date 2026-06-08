import mongoose from 'mongoose';

const aiQuizAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIGeneratedQuiz', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    answers: [{ type: Number }], // Array of selected option indices
  },
  { timestamps: true }
);

aiQuizAttemptSchema.index({ studentId: 1, courseId: 1 });
aiQuizAttemptSchema.index({ studentId: 1, quizId: 1 });

export default mongoose.model('AIQuizAttempt', aiQuizAttemptSchema);
