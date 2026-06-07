import mongoose from 'mongoose';

const learningBottleneckSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' },
    
    bottleneckType: { type: String, enum: ['QuizFailure', 'HighDropOff', 'PoorRetention', 'InterviewGap'], required: true },
    description: { type: String, required: true },
    affectedStudentsPercentage: { type: Number, default: 0 },
    
    // e.g. "React Hooks", "Dynamic Programming"
    relatedConcept: { type: String },
    
    status: { type: String, enum: ['Active', 'Resolved', 'Ignored'], default: 'Active' },
    detectedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('LearningBottleneck', learningBottleneckSchema);
