import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    fileUrl: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: true }
);

const lectureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    videoUrl: { type: String, required: true, trim: true, maxlength: 500 },
    duration: { type: Number, required: true, min: 0 },
    resources: { type: [resourceSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Lecture', lectureSchema);
