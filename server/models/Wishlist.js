import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  { timestamps: true }
);

// Performance: Indexes on studentId and courseId, prevent duplicates
wishlistSchema.index({ student: 1, course: 1 }, { unique: true });
wishlistSchema.index({ course: 1 });

export default mongoose.model('Wishlist', wishlistSchema);
