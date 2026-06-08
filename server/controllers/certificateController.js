import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import Certificate from '../models/Certificate.js';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';

// --- PHASE 2: AUTOMATIC ELIGIBILITY ENGINE ---
export const checkEligibility = async (studentId, courseId) => {
  const reasons = [];

  const course = await Course.findById(courseId).populate('instructor');
  if (!course) {
    return { isEligible: false, reasons: ['Course not found'], course: null };
  }
  if (course.status !== 'published') {
    reasons.push('Course is not published');
  }

  const progress = await Progress.findOne({ user: studentId, course: courseId });
  if (!progress) {
    return { isEligible: false, reasons: ['No progress found for this course'], course };
  }

  const sections = await Section.find({ course: courseId });
  const totalLectures = sections.reduce((sum, section) => sum + (section.lectures ? section.lectures.length : 0), 0);

  if (!progress.completed && progress.completionPercentage < 100) {
    reasons.push(`Course not fully completed. Progress: ${progress.completionPercentage}%`);
  }

  const quizzes = await Quiz.find({ course: courseId });
  for (const quiz of quizzes) {
    const passedAttempt = await QuizAttempt.findOne({ student: studentId, quiz: quiz._id, isPassed: true });
    if (!passedAttempt) {
      reasons.push(`Mandatory quiz not passed. Lecture ID: ${quiz.lecture}`);
    }
  }

  const assignments = await Assignment.find({ course: courseId });
  for (const assignment of assignments) {
    const submission = await AssignmentSubmission.findOne({ student: studentId, assignment: assignment._id });
    // Assuming a submission is required; ideally check if graded and passed
    if (!submission) {
      reasons.push(`Mandatory assignment not submitted: ${assignment.title}`);
    }
  }

  return { isEligible: reasons.length === 0, reasons, course, progress };
};

// --- PHASE 3 & 4: PDF ENGINE & QR VERIFICATION ---
export const generateCertificate = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { courseId } = req.params;

    // Phase 1 check: Prevent duplicate generation
    const existingCert = await Certificate.findOne({
      $or: [
        { studentId, courseId },
        { user: studentId, course: courseId }
      ]
    });
    if (existingCert) {
      return res.json({ success: true, certificate: existingCert, message: 'Certificate already generated' });
    }

    // Check Eligibility
    const eligibility = await checkEligibility(studentId, courseId);
    if (!eligibility.isEligible) {
      return res.status(400).json({ success: false, message: 'Not eligible for certificate', reasons: eligibility.reasons });
    }

    const { course, progress } = eligibility;
    const instructorName = course.instructor.name || 'Instructor';

    // Generate Secure Identifiers
    const certPrefix = course.title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'LMS');
    const uniqueSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const certificateId = `${certPrefix}-${new Date().getFullYear()}-${uniqueSuffix}`;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const qrVerificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-certificate/${verificationToken}`;

    // PDF Preparation
    const certDir = path.join(process.cwd(), 'server', 'uploads', 'certificates');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    const fileName = `${certificateId}.pdf`;
    const generatedPdfPath = `/uploads/certificates/${fileName}`;
    const filePath = path.join(certDir, fileName);

    // Generate QR Code Buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrVerificationUrl, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#000000', light: '#ffffff' } });

    // Premium PDF Layout
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    doc.pipe(fs.createWriteStream(filePath));

    // Colors
    const primaryColor = '#1e3a8a'; // Deep blue
    const secondaryColor = '#0f172a'; // Slate
    const goldColor = '#b45309';

    // Outer Border
    doc.lineWidth(10).strokeColor(primaryColor).rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    // Inner Border
    doc.lineWidth(2).strokeColor(goldColor).rect(35, 35, doc.page.width - 70, doc.page.height - 70).stroke();

    // Watermark Background
    doc.fillColor('#f8fafc').fontSize(150).opacity(0.1)
       .text('VERIFIED', 0, doc.page.height / 2 - 75, { align: 'center', angle: -20 });
    doc.opacity(1); // Reset opacity

    // Header Logo/Branding
    doc.moveDown(3);
    doc.fontSize(28).fillColor(primaryColor).text('LMS CERTIFICATION AUTHORITY', { align: 'center', characterSpacing: 2 });
    
    // Ribbon
    doc.rect(doc.page.width / 2 - 150, 110, 300, 30).fill(goldColor);
    doc.fontSize(14).fillColor('#ffffff').text('OFFICIAL CERTIFICATE OF COMPLETION', 0, 117, { align: 'center', characterSpacing: 1 });

    // Body Text
    doc.moveDown(3);
    doc.fontSize(16).fillColor(secondaryColor).text('This is to proudly certify that', { align: 'center' });
    doc.moveDown(1);
    
    // Dynamic scaling for name
    const studentName = req.user.name.toUpperCase();
    const nameFontSize = studentName.length > 20 ? 30 : 40;
    doc.fontSize(nameFontSize).fillColor(primaryColor).text(studentName, { align: 'center' });
    
    // Line under name
    const textWidth = doc.widthOfString(studentName);
    doc.lineWidth(1).strokeColor('#cbd5e1').moveTo(doc.page.width / 2 - textWidth / 2 - 20, doc.y).lineTo(doc.page.width / 2 + textWidth / 2 + 20, doc.y).stroke();

    doc.moveDown(1);
    doc.fontSize(16).fillColor(secondaryColor).text('has successfully completed the comprehensive program requirements for', { align: 'center' });
    doc.moveDown(1);

    // Dynamic scaling for course title
    const courseTitle = course.title;
    const titleFontSize = courseTitle.length > 40 ? 20 : 26;
    doc.fontSize(titleFontSize).fillColor(goldColor).text(courseTitle, { align: 'center', width: doc.page.width - 200, continued: false });

    // Signatures
    const signatureY = doc.page.height - 180;
    
    // Instructor Signature
    doc.fontSize(12).fillColor(secondaryColor).text('_________________________', 100, signatureY);
    doc.moveDown(0.5);
    doc.text(instructorName, 100, doc.y);
    doc.fontSize(10).fillColor('#64748b').text('Lead Instructor', 100, doc.y);

    // QR Code
    const qrX = doc.page.width / 2 - 40;
    doc.image(qrCodeBuffer, qrX, signatureY - 20, { width: 80 });
    doc.fontSize(8).fillColor('#64748b').text('Scan to Verify', qrX, signatureY + 65, { width: 80, align: 'center' });

    // Org Signature
    doc.fontSize(12).fillColor(secondaryColor).text('_________________________', doc.page.width - 300, signatureY, { align: 'right' });
    doc.moveDown(0.5);
    doc.text('LMS Academic Board', doc.page.width - 300, doc.y, { align: 'right' });
    doc.fontSize(10).fillColor('#64748b').text('Authorized Signature', doc.page.width - 300, doc.y, { align: 'right' });

    // Footer Metadata
    const footerY = doc.page.height - 70;
    const issueDate = new Date();
    doc.fontSize(10).fillColor('#94a3b8')
       .text(`Certificate ID: ${certificateId}`, 50, footerY)
       .text(`Issued: ${issueDate.toLocaleDateString()}`, doc.page.width / 2 - 50, footerY)
       .text(`Verify at: ${qrVerificationUrl}`, doc.page.width - 350, footerY, { align: 'right' });

    doc.end();

    // Save to Database
    const newCert = await Certificate.create({
      certificateId,
      studentId,
      courseId,
      instructorId: course.instructor._id,
      issuedAt: issueDate,
      completionDate: issueDate,
      completionPercentage: 100,
      verificationToken,
      qrVerificationUrl,
      generatedPdfPath,
      
      // Legacy fields to maintain backwards compatibility briefly
      userId: studentId,
      certificateNumber: certificateId,
      instructorName,
      courseTitle,
      pdfUrl: generatedPdfPath
    });

    // Mark progress as completed if not already
    if (!progress.completed) {
      progress.completed = true;
      progress.completionPercentage = 100;
      await progress.save();
    }

    try {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({
        userId: studentId,
        title: 'Certificate Issued!',
        message: `Your certificate for ${courseTitle} is ready.`,
        type: 'certificate_issued',
        link: `/student/certificates`
      });
    } catch (err) {
      console.error('Failed to create certificate notification:', err);
    }

    res.status(201).json({ success: true, certificate: newCert });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Certificate already exists or token collision occurred.' });
    }
    console.error('Error generating certificate:', err);
    res.status(500).json({ success: false, message: 'Server error generating certificate.' });
  }
};

export const getStudentCertificates = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const certificates = await Certificate.find({
      $or: [{ studentId }, { user: studentId }]
    })
      .populate('courseId', 'thumbnail title')
      .populate('instructorId', 'name')
      .sort({ issuedAt: -1 });
    res.json({ success: true, certificates });
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCertificate = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { courseId } = req.params;
    const certificate = await Certificate.findOne({
      $or: [
        { studentId, courseId },
        { user: studentId, course: courseId }
      ]
    })
      .populate('courseId', 'thumbnail title')
      .populate('instructorId', 'name');
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.json({ success: true, certificate });
  } catch (err) {
    console.error('Error fetching certificate:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const downloadCertificate = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { courseId } = req.params;
    const certificate = await Certificate.findOne({
      $or: [
        { studentId, courseId },
        { user: studentId, course: courseId }
      ]
    });
    if (!certificate) {
      // Auto-generate if not found
      const { checkEligibility } = await import('./certificateController.js');
      const eligibility = await checkEligibility(studentId, courseId);
      if (!eligibility.isEligible) {
        return res.status(400).json({ success: false, message: 'Not eligible for certificate', reasons: eligibility.reasons });
      }
      
      // Instead of failing, we can tell the user they need to generate it first. 
      // Actually, let's just generate it inline.
      // But we need the logic. It's simpler to just reuse the generate logic or return a redirect.
      // Wait, we can't redirect to a POST. Let's just return JSON saying they need to generate.
      return res.status(404).json({ success: false, message: 'Certificate not generated yet. Please click "Get Certificate" first.' });
    }
    
    const filePath = path.join(process.cwd(), 'server', certificate.generatedPdfPath);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, `Certificate-${certificate.certificateId}.pdf`);
    } else {
      res.status(404).json({ success: false, message: 'Certificate file not found on server' });
    }
  } catch (err) {
    console.error('Error downloading certificate:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- PHASE 4: PUBLIC VERIFICATION ENDPOINT ---
export const verifyCertificate = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Allow lookup by verificationToken OR certificateId
    const certificate = await Certificate.findOne({
      $or: [{ verificationToken: token }, { certificateId: token }]
    }).populate('studentId', 'name email').populate('courseId', 'title').populate('instructorId', 'name');

    if (!certificate) {
      return res.status(404).json({ success: false, status: 'Invalid', message: 'Certificate not found' });
    }

    if (certificate.isRevoked || certificate.status === 'Revoked') {
      return res.json({ 
        success: true, 
        status: 'Revoked', 
        revocationReason: certificate.revocationReason,
        certificate: {
          certificateId: certificate.certificateId,
          studentName: certificate.studentId.name,
          courseTitle: certificate.courseId.title
        }
      });
    }

    res.json({ 
      success: true, 
      status: 'Valid', 
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentId.name,
        courseTitle: certificate.courseId.title,
        instructorName: certificate.instructorId.name,
        issuedAt: certificate.issuedAt,
        completionPercentage: certificate.completionPercentage,
        pdfUrl: certificate.generatedPdfPath
      }
    });

  } catch (err) {
    console.error('Error verifying certificate:', err);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// --- PHASE 8 & 9: ADMIN & SECURITY ---
export const revokeCertificate = async (req, res) => {
  try {
    const { certificateId, reason } = req.body;
    
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Verify permissions: only instructor of the course or Admin
    if (req.user.role !== 'admin' && certificate.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to revoke this certificate' });
    }

    certificate.isRevoked = true;
    certificate.status = 'Revoked';
    certificate.revocationReason = reason || 'Violation of academic integrity';
    await certificate.save();

    res.json({ success: true, message: 'Certificate revoked successfully' });
  } catch (err) {
    console.error('Error revoking certificate:', err);
    res.status(500).json({ success: false, message: 'Server error during revocation' });
  }
};

// --- PHASE 7: INSTRUCTOR ANALYTICS ---
export const getInstructorCertificateAnalytics = async (req, res) => {
  try {
    const instructorId = req.user._id;
    
    const certificates = await Certificate.find({ instructorId }).populate('courseId', 'title').populate('studentId', 'name');
    
    const totalIssued = certificates.length;
    const revokedCount = certificates.filter(c => c.isRevoked).length;
    
    // Certificates per course
    const courseMap = {};
    certificates.forEach(c => {
      const title = c.courseId?.title || 'Unknown Course';
      courseMap[title] = (courseMap[title] || 0) + 1;
    });

    const recentIssuances = certificates.sort((a,b) => new Date(b.issuedAt) - new Date(a.issuedAt)).slice(0, 5).map(c => ({
      certificateId: c.certificateId,
      studentName: c.studentId?.name,
      courseTitle: c.courseId?.title,
      issuedAt: c.issuedAt,
      status: c.status
    }));

    res.json({
      success: true,
      analytics: {
        totalIssued,
        validCertificates: totalIssued - revokedCount,
        revokedCount,
        certificatesPerCourse: Object.keys(courseMap).map(k => ({ name: k, count: courseMap[k] })),
        recentIssuances
      }
    });

  } catch (err) {
    console.error('Error fetching instructor analytics:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
