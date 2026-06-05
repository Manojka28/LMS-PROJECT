import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 300, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    thumbnail: { type: String, trim: true, maxlength: 500, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all levels'],
      default: 'beginner',
    },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, min: 0, default: 0 },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });

export default mongoose.model('Course', courseSchema);
