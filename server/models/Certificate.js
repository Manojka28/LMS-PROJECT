import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true }, // Human-readable like CERT-ABC-123
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
    completionDate: { type: Date, default: Date.now },
    completionPercentage: { type: Number, required: true, min: 100, max: 100 }, // Ensure 100%
    verificationToken: { type: String, required: true, unique: true }, // Cryptographically secure
    qrVerificationUrl: { type: String, required: true }, // The URL encoded in the QR code
    status: { type: String, enum: ['Valid', 'Revoked'], default: 'Valid' },
    isRevoked: { type: Boolean, default: false },
    revocationReason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    generatedPdfPath: { type: String, required: true },
    
    // Legacy mapping to avoid immediately breaking frontend components using older data
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    certificateNumber: { type: String },
    instructorName: { type: String },
    courseTitle: { type: String },
    pdfUrl: { type: String }
  },
  { timestamps: true }
);

// Prevent duplicate certificates per student/course
certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });


export default mongoose.model('Certificate', certificateSchema);
