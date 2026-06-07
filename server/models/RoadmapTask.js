import mongoose from 'mongoose';

const roadmapTaskSchema = new mongoose.Schema(
  {
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapMilestone', required: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerRoadmap', required: true },
    taskType: { type: String, enum: ['Learning', 'Project', 'Practice', 'Interview', 'Revision'], default: 'Learning' },
    taskTitle: { type: String, required: true },
    taskDescription: { type: String },
    
    // LMS Integration (Phase 3)
    lmsCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    
    // Extracted resources or specific skill graphs
    targetSkills: [{ type: String }],
    
    estimatedTime: { type: Number, default: 0 }, // in hours
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('RoadmapTask', roadmapTaskSchema);
