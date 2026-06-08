import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    interviewType: { type: String, required: true }, // e.g., MERN Stack, System Design, Behavioral
    companyTarget: { type: String, enum: ['Startup', 'Product Company', 'Service Company', 'FAANG'], default: 'Product Company' },
    round: { type: Number, default: 1 }, // Phase 2: Round 1, Round 2, etc.
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    
    // Scores
    overallScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    problemSolvingScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    systemDesignScore: { type: Number, default: 0 },
    codeQualityScore: { type: Number, default: 0 },
    
    status: { type: String, enum: ['Active', 'Completed', 'Abandoned'], default: 'Active' },
    recommendation: { type: String } // 'Strong Hire', 'Hire', 'Leaning Hire', 'No Hire'
  },
  { timestamps: true }
);

export default mongoose.model('InterviewSession', interviewSessionSchema);
