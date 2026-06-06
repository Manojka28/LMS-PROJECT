import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import Certificate from '../models/Certificate.js';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';

function generateCertificateId() {
  return 'CERT-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + Date.now().toString().slice(-4);
}

export async function getMyCertificates(req, res, next) {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('course', 'title thumbnail instructor')
      .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } })
      .sort({ issuedAt: -1 });

    res.json({ success: true, certificates });
  } catch (err) {
    next(err);
  }
}

export async function downloadCertificate(req, res, next) {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress || !progress.completed) {
      return res.status(403).json({ success: false, message: 'Course is not completed yet' });
    }

    let certificate = await Certificate.findOne({ user: userId, course: courseId });
    if (!certificate) {
      certificate = await Certificate.create({
        user: userId,
        course: courseId,
        certificateId: generateCertificateId()
      });

      const courseTitle = await Course.findById(courseId).select('title');
      await Notification.create({
        userId: userId,
        type: 'CERTIFICATE_EARNED',
        title: 'Certificate Earned',
        message: `Congratulations! You have earned a certificate for "${courseTitle.title}".`,
        link: `/student/certificates`
      });
    }

    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Generate PDF
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate-${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

    doc.pipe(res);

    // Styling the PDF
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
    
    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#3b82f6');

    doc.fillColor('#333333');
    doc.fontSize(40).text('Certificate of Completion', { align: 'center' });
    doc.moveDown();

    doc.fontSize(20).text('This is to certify that', { align: 'center', color: '#666666' });
    doc.moveDown();

    doc.fontSize(30).fillColor('#111111').text(req.user.name, { align: 'center', underline: true });
    doc.moveDown();

    doc.fontSize(20).fillColor('#666666').text('has successfully completed the course', { align: 'center' });
    doc.moveDown();

    doc.fontSize(25).fillColor('#3b82f6').text(course.title, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).fillColor('#333333').text(`Instructor: ${course.instructor?.name || 'Unknown'}`, { align: 'center' });
    doc.text(`Completed on: ${new Date(certificate.issuedAt).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).fillColor('#888888').text(`Certificate ID: ${certificate.certificateId}`, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}
