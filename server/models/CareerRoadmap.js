import mongoose from 'mongoose';

const careerRoadmapSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    targetRole: { type: String, required: true },
    experienceLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    durationWeeks: { type: Number, required: true },
    currentStatus: { type: String, enum: ['Active', 'Paused', 'Completed'], default: 'Active' },
    completionPercentage: { type: Number, default: 0 },
    generatedByAI: { type: Boolean, default: true },
    
    // Resume Readiness metrics
    jobReadiness: { type: Number, default: 0 },
    interviewReadiness: { type: Number, default: 0 },
    skillCoverage: { type: Number, default: 0 },
    
    // Streaks & Analytics
    currentStreak: { type: Number, default: 0 },
    highestStreak: { type: Number, default: 0 },
    totalHoursInvested: { type: Number, default: 0 },
    lastActiveDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('CareerRoadmap', careerRoadmapSchema);
