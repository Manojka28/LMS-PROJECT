import mongoose from 'mongoose';

const aiQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, // Index of the correct option
    explanation: { type: String, default: '' },
  },
  { _id: true }
);

const aiGeneratedQuizSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
    questions: { type: [aiQuestionSchema], required: true },
  },
  { timestamps: true }
);

aiGeneratedQuizSchema.index({ studentId: 1, courseId: 1 });

export default mongoose.model('AIGeneratedQuiz', aiGeneratedQuizSchema);
