import mongoose from 'mongoose';

const courseOptimizationRecommendationSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    recommendationType: { type: String, enum: ['NewLecture', 'UpdateLecture', 'AddQuiz', 'AddPractice', 'AddProject', 'AddRevision'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    
    expectedImpactScore: { type: Number, default: 0 }, // 1-100 prediction of how much this helps
    
    status: { type: String, enum: ['Pending', 'Implemented', 'Dismissed'], default: 'Pending' }
  },
  { timestamps: true }
);

export default mongoose.model('CourseOptimizationRecommendation', courseOptimizationRecommendationSchema);
