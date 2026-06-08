import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // Internal order ID or Razorpay Order ID
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    amount: { type: Number, required: true }, // Final amount paid
    currency: { type: String, default: 'USD' },
    
    discountApplied: { type: Number, default: 0 },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    
    status: { type: String, enum: ['Pending', 'Successful', 'Failed', 'Cancelled', 'Refunded'], default: 'Pending' },
    
    paymentMethod: { type: String }, // e.g., 'Card', 'UPI', 'NetBanking'
    gatewayOrderId: { type: String }, // External gateway reference
    
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
