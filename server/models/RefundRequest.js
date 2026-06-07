import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    reason: { type: String, required: true },
    refundAmount: { type: Number, required: true },
    
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who reviewed it
    reviewNotes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('RefundRequest', refundRequestSchema);
