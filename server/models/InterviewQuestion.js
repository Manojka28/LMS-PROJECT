import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    questionText: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true },
    expectedConcepts: [{ type: String }],
    
    // Student Answer
    studentAnswer: { type: String },
    answeredAt: { type: Date },
    
    // Evaluation Engine Data
    score: { type: Number, default: 0 }, // 0-100
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    problemSolvingScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    feedback: { type: String },
    missedConcepts: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model('InterviewQuestion', interviewQuestionSchema);
