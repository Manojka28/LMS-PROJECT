import mongoose from 'mongoose';

const lectureInsightSchema = new mongoose.Schema(
  {
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true, unique: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    
    // Heatmap / Behavior Analytics (Phase 3)
    watchRatePercentage: { type: Number, default: 0 },
    pauseFrequency: { type: Number, default: 0 },
    replayFrequency: { type: Number, default: 0 },
    dropOffCount: { type: Number, default: 0 },
    
    mostReplayedSectionTimestamp: { type: Number }, // seconds
    mostSkippedSectionTimestamp: { type: Number },
    
    difficultyRiskScore: { type: Number, default: 0 } // 0-100
  },
  { timestamps: true }
);

export default mongoose.model('LectureInsight', lectureInsightSchema);
