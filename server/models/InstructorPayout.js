import mongoose from 'mongoose';

const instructorPayoutSchema = new mongoose.Schema(
  {
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    
    status: { type: String, enum: ['Pending', 'Processing', 'Paid', 'Failed'], default: 'Pending' },
    
    transactionReference: { type: String }, // Bank transfer ID or payout ID
    paidAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('InstructorPayout', instructorPayoutSchema);
