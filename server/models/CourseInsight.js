import mongoose from 'mongoose';

const courseInsightSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Core Scoring (Phase 9)
    courseQualityScore: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    learningOutcomeScore: { type: Number, default: 0 },
    placementOutcomeScore: { type: Number, default: 0 },
    studentSatisfactionScore: { type: Number, default: 0 },
    
    // Aggregated Behavioral Stats (Phase 2)
    averageWatchDuration: { type: Number, default: 0 }, // in seconds
    completionRatePercentage: { type: Number, default: 0 },
    dropOffPredictionRisk: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    
    // AI Insights (Phase 12)
    executiveSummary: { type: String },
    
    lastAnalyzedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('CourseInsight', courseInsightSchema);
