import mongoose from 'mongoose';

const roadmapMilestoneSchema = new mongoose.Schema(
  {
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerRoadmap', required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    estimatedHours: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    completionPercentage: { type: Number, default: 0 },
    isRevisionWeek: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('RoadmapMilestone', roadmapMilestoneSchema);
