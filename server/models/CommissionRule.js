import mongoose from 'mongoose';

const commissionRuleSchema = new mongoose.Schema(
  {
    instructorSharePercentage: { type: Number, default: 70 }, // 70% to instructor
    platformSharePercentage: { type: Number, default: 30 }, // 30% to platform
    
    // Can be overridden for specific instructors
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('CommissionRule', commissionRuleSchema);
