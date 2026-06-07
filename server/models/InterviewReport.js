import mongoose from 'mongoose';

const interviewReportSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Aggregate analysis
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    knowledgeGaps: [{ type: String }],
    
    // AI Recommendations
    suggestedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    suggestedProjects: [{ type: String }],
    suggestedRoadmapTasks: [{ type: String }],
    
    expectedPreparationTimeWeeks: { type: Number, default: 0 },
    hiringRecommendation: { type: String }, // Phase 10
    
    readinessScoreDelta: { type: Number, default: 0 } // How much their readiness changed
  },
  { timestamps: true }
);

export default mongoose.model('InterviewReport', interviewReportSchema);
