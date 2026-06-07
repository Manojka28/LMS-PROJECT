import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['Percentage', 'Fixed'], required: true },
    discountValue: { type: Number, required: true }, // e.g. 20 (for 20%) or 50 (for $50 off)
    
    couponType: { type: String, enum: ['Global', 'Course-Specific', 'Instructor'], default: 'Global' },
    targetCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // If Course-Specific
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If Instructor
    
    expiryDate: { type: Date },
    usageLimit: { type: Number, default: 100 }, // Max times it can be used
    timesUsed: { type: Number, default: 0 },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
