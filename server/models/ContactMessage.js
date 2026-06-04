import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactMessageSchema);
