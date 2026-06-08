import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true }, // Tax breakdown
    taxRate: { type: Number, default: 18 }, // e.g. 18% GST
    totalAmount: { type: Number, required: true },
    
    pdfUrl: { type: String }, // Link to generated invoice PDF
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);
