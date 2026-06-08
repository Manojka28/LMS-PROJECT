import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true }, // Razorpay Payment ID
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    
    status: { type: String, enum: ['Success', 'Failed', 'Pending'], required: true },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed }, // Raw response from Razorpay
    
    signatureVerification: { type: Boolean, default: false } // Webhook validation
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
