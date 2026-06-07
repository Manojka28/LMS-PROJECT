import mongoose from 'mongoose';

const resumeProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    summary: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    skills: [{ type: String }],
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        year: { type: String, required: true },
        grade: { type: String, default: '' }
      }
    ],
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        link: { type: String, default: '' }
      }
    ],
    certifications: [
      {
        title: { type: String, required: true },
        issuer: { type: String, required: true },
        year: { type: String, required: true }
      }
    ],
    achievements: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model('ResumeProfile', resumeProfileSchema);
