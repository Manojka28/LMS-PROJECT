import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'System' },
    
    link: { type: String }, // Optional CTA link
    
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
