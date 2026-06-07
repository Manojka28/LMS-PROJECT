import mongoose from 'mongoose';

const placementReadinessProfileSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    
    // Core Placement Gauges (Phase 6)
    placementReadinessScore: { type: Number, default: 0 },
    interviewReadinessScore: { type: Number, default: 0 },
    technicalReadinessScore: { type: Number, default: 0 },
    communicationReadinessScore: { type: Number, default: 0 },
    companyReadinessScore: { type: Number, default: 0 }, // Evaluated against their targetCompany Type
    
    targetCompanyType: { type: String, enum: ['Startup', 'Product Company', 'Service Company', 'FAANG'], default: 'Product Company' },
    
    // Aggregated from Interviews
    totalInterviewsTaken: { type: Number, default: 0 },
    avgTechnicalScore: { type: Number, default: 0 },
    avgCommunicationScore: { type: Number, default: 0 },
    
    // Phase 11 Gamification
    badges: [{ type: String }],
    currentInterviewStreak: { type: Number, default: 0 },
    highestInterviewStreak: { type: Number, default: 0 },
    lastInterviewDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('PlacementReadinessProfile', placementReadinessProfileSchema);
