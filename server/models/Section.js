import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' }],
  },
  { timestamps: true }
);

sectionSchema.index({ course: 1 });

export default mongoose.model('Section', sectionSchema);
