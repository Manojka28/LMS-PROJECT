import ResumeProfile from '../models/ResumeProfile.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

// Helper for wrapping text and avoiding page breaks in bad spots
const checkSpace = (doc, heightRequired) => {
  if (doc.y + heightRequired > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
};

export const getProfile = async (req, res) => {
  try {
    let profile = await ResumeProfile.findOne({ user: req.user._id });
    if (!profile) {
      // Return empty profile layout
      const user = await User.findById(req.user._id);
      profile = {
        fullName: user.name,
        email: user.email,
        phone: '', summary: '', linkedin: '', github: '', portfolio: '',
        skills: [], education: [], projects: [], certifications: [], achievements: []
      };
    }
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const data = req.body;
    let profile = await ResumeProfile.findOne({ user: req.user._id });
    if (profile) {
      profile = await ResumeProfile.findOneAndUpdate({ user: req.user._id }, data, { new: true });
    } else {
      profile = await ResumeProfile.create({ user: req.user._id, ...data });
    }
    res.json({ success: true, profile, message: 'Profile saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const generateResume = async (req, res) => {
  try {
    const template = req.body.template || req.query.template || 'modern';
    let profile = await ResumeProfile.findOne({ user: req.user._id });

    if (!profile) {
      const user = await User.findById(req.user._id);
      profile = new ResumeProfile({
        user: req.user._id,
        fullName: user.name,
        email: user.email
      });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    const safeName = (profile.fullName || 'Unnamed_Profile').replace(/\s+/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Resume.pdf"`);
    
    doc.pipe(res);

    // Sanitize profile
    const safeProfile = {
      ...profile.toObject(),
      fullName: profile.fullName || 'Unnamed Profile',
      email: profile.email || '',
      phone: profile.phone || '',
      summary: profile.summary || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      portfolio: profile.portfolio || '',
      skills: profile.skills || [],
      education: profile.education || [],
      projects: profile.projects || [],
      certifications: profile.certifications || [],
      achievements: profile.achievements || []
    };

    if (template === 'modern') {
      generateModernTemplate(doc, safeProfile);
    } else if (template === 'ats') {
      generateAtsTemplate(doc, safeProfile);
    } else {
      generateProfessionalTemplate(doc, safeProfile);
    }

    doc.end();

  } catch (err) {
    console.error('Error generating resume:', err);
    res.status(500).json({ success: false, message: 'Error generating resume PDF' });
  }
};

// --- Templates ---

function generateModernTemplate(doc, profile) {
  // Header background
  doc.rect(0, 0, doc.page.width, 120).fill('#1e293b');
  
  // Header Text
  doc.fillColor('#ffffff').fontSize(28).text(profile.fullName.toUpperCase(), 50, 40, { tracking: 2 });
  
  // Contact Info
  doc.fontSize(10).fillColor('#94a3b8');
  const contacts = [profile.email, profile.phone, profile.linkedin, profile.github, profile.portfolio].filter(Boolean).join('  |  ');
  doc.text(contacts, 50, 80);

  doc.moveDown(4);
  doc.fillColor('#000000');

  // Summary
  if (profile.summary) {
    renderSectionTitle(doc, 'PROFILE', '#0ea5e9');
    doc.fontSize(11).fillColor('#334155').text(profile.summary, { align: 'justify', lineHeight: 1.5 });
    doc.moveDown(1.5);
  }

  // Skills
  if (profile.skills && profile.skills.length > 0) {
    checkSpace(doc, 60);
    renderSectionTitle(doc, 'EXPERTISE', '#0ea5e9');
    doc.fontSize(11).fillColor('#334155').text(profile.skills.join(' • '), { lineHeight: 1.5 });
    doc.moveDown(1.5);
  }

  // Education
  if (profile.education && profile.education.length > 0) {
    checkSpace(doc, 80);
    renderSectionTitle(doc, 'EDUCATION', '#0ea5e9');
    profile.education.forEach(edu => {
      checkSpace(doc, 40);
      doc.fontSize(12).fillColor('#0f172a').text(edu.degree, { continued: true }).fillColor('#64748b').text(` — ${edu.year}`, { align: 'right' });
      doc.fontSize(11).fillColor('#334155').text(edu.institution);
      if (edu.grade) doc.fontSize(10).text(`Grade: ${edu.grade}`);
      doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  // Projects
  if (profile.projects && profile.projects.length > 0) {
    checkSpace(doc, 80);
    renderSectionTitle(doc, 'PROJECTS', '#0ea5e9');
    profile.projects.forEach(proj => {
      checkSpace(doc, 50);
      doc.fontSize(12).fillColor('#0f172a').text(proj.title, { continued: !!proj.link });
      if (proj.link) {
        doc.fillColor('#0ea5e9').text(` (${proj.link})`);
      }
      doc.fontSize(11).fillColor('#334155').text(proj.description, { align: 'justify', lineHeight: 1.2 });
      doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  // Certifications
  if (profile.certifications && profile.certifications.length > 0) {
    checkSpace(doc, 60);
    renderSectionTitle(doc, 'CERTIFICATIONS', '#0ea5e9');
    profile.certifications.forEach(cert => {
      checkSpace(doc, 30);
      doc.fontSize(11).fillColor('#0f172a').text(`• ${cert.title} - ${cert.issuer} (${cert.year})`);
    });
    doc.moveDown(1.5);
  }

  // Achievements
  if (profile.achievements && profile.achievements.length > 0) {
    checkSpace(doc, 60);
    renderSectionTitle(doc, 'ACHIEVEMENTS', '#0ea5e9');
    profile.achievements.forEach(ach => {
      checkSpace(doc, 20);
      doc.fontSize(11).fillColor('#334155').text(`• ${ach}`);
    });
  }
}

function generateAtsTemplate(doc, profile) {
  doc.fillColor('#000000');
  
  // Header
  doc.fontSize(24).font('Times-Bold').text(profile.fullName, { align: 'center' });
  doc.moveDown(0.2);
  
  const contacts = [profile.email, profile.phone, profile.linkedin, profile.github, profile.portfolio].filter(Boolean).join(' | ');
  doc.fontSize(11).font('Times-Roman').text(contacts, { align: 'center' });
  doc.moveDown(1.5);

  const renderAtsTitle = (title) => {
    doc.font('Times-Bold').fontSize(12).text(title.toUpperCase());
    doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(0.5);
  };

  if (profile.summary) {
    renderAtsTitle('Professional Summary');
    doc.font('Times-Roman').fontSize(11).text(profile.summary, { align: 'justify' });
    doc.moveDown(1);
  }

  if (profile.education && profile.education.length > 0) {
    checkSpace(doc, 80);
    renderAtsTitle('Education');
    profile.education.forEach(edu => {
      checkSpace(doc, 40);
      doc.font('Times-Bold').fontSize(11).text(edu.institution, { continued: true });
      doc.font('Times-Roman').text(`, ${edu.year}`, { align: 'right' });
      doc.font('Times-Italic').text(edu.degree);
      if (edu.grade) doc.font('Times-Roman').text(`Grade: ${edu.grade}`);
      doc.moveDown(0.5);
    });
    doc.moveDown(0.5);
  }

  if (profile.skills && profile.skills.length > 0) {
    checkSpace(doc, 50);
    renderAtsTitle('Skills');
    doc.font('Times-Roman').fontSize(11).text(profile.skills.join(', '));
    doc.moveDown(1);
  }

  if (profile.projects && profile.projects.length > 0) {
    checkSpace(doc, 80);
    renderAtsTitle('Projects');
    profile.projects.forEach(proj => {
      checkSpace(doc, 40);
      doc.font('Times-Bold').fontSize(11).text(proj.title, { continued: !!proj.link });
      if (proj.link) doc.font('Times-Roman').text(` - ${proj.link}`);
      doc.moveDown(0.2);
      doc.font('Times-Roman').fontSize(11).text(`• ${proj.description}`, { align: 'justify' });
      doc.moveDown(0.5);
    });
    doc.moveDown(0.5);
  }

  if (profile.certifications && profile.certifications.length > 0) {
    checkSpace(doc, 60);
    renderAtsTitle('Certifications');
    profile.certifications.forEach(cert => {
      checkSpace(doc, 20);
      doc.font('Times-Roman').fontSize(11).text(`• ${cert.title}, ${cert.issuer} (${cert.year})`);
    });
    doc.moveDown(1);
  }

  if (profile.achievements && profile.achievements.length > 0) {
    checkSpace(doc, 60);
    renderAtsTitle('Achievements');
    profile.achievements.forEach(ach => {
      checkSpace(doc, 20);
      doc.font('Times-Roman').fontSize(11).text(`• ${ach}`);
    });
  }
}

function generateProfessionalTemplate(doc, profile) {
  // Left column (Sidebar)
  doc.rect(0, 0, 200, doc.page.height).fill('#f1f5f9');
  
  // Right column Content bounds
  const rightX = 230;
  const rightWidth = doc.page.width - rightX - 40;

  // Header in sidebar
  doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text(profile.fullName, 30, 50, { width: 150 });
  doc.moveDown(1);

  // Contacts
  doc.fontSize(10).font('Helvetica').fillColor('#475569');
  [profile.email, profile.phone, profile.linkedin, profile.github, profile.portfolio].forEach(contact => {
    if (contact) {
      doc.text(contact, 30, doc.y, { width: 140, underline: false });
      doc.moveDown(0.5);
    }
  });

  doc.moveDown(2);

  // Skills in sidebar
  if (profile.skills && profile.skills.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('SKILLS', 30, doc.y);
    doc.moveTo(30, doc.y).lineTo(170, doc.y).lineWidth(1).stroke('#cbd5e1');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#475569');
    profile.skills.forEach(skill => {
      doc.text(`• ${skill}`, 30, doc.y, { width: 140 });
      doc.moveDown(0.3);
    });
  }

  doc.moveDown(2);

  // Certifications in sidebar
  if (profile.certifications && profile.certifications.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('CERTIFICATES', 30, doc.y);
    doc.moveTo(30, doc.y).lineTo(170, doc.y).lineWidth(1).stroke('#cbd5e1');
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').fillColor('#475569');
    profile.certifications.forEach(cert => {
      doc.text(`${cert.title}\n${cert.issuer} (${cert.year})`, 30, doc.y, { width: 140 });
      doc.moveDown(0.5);
    });
  }

  // Switch to Right Column for main content
  doc.y = 50;

  const renderProfTitle = (title) => {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text(title, rightX, doc.y);
    doc.moveTo(rightX, doc.y).lineTo(rightX + rightWidth, doc.y).lineWidth(1).stroke('#e2e8f0');
    doc.moveDown(0.5);
  };

  if (profile.summary) {
    renderProfTitle('PROFILE');
    doc.fontSize(10).font('Helvetica').fillColor('#334155').text(profile.summary, rightX, doc.y, { width: rightWidth, align: 'justify', lineHeight: 1.4 });
    doc.moveDown(1.5);
  }

  if (profile.education && profile.education.length > 0) {
    renderProfTitle('EDUCATION');
    profile.education.forEach(edu => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text(edu.degree, rightX, doc.y, { continued: true, width: rightWidth });
      doc.font('Helvetica').text(` | ${edu.year}`, { align: 'right' });
      doc.fontSize(10).fillColor('#475569').text(edu.institution, rightX, doc.y, { width: rightWidth });
      if (edu.grade) doc.text(`Grade: ${edu.grade}`, rightX, doc.y, { width: rightWidth });
      doc.moveDown(1);
    });
  }

  if (profile.projects && profile.projects.length > 0) {
    renderProfTitle('PROJECTS');
    profile.projects.forEach(proj => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text(proj.title, rightX, doc.y, { width: rightWidth });
      if (proj.link) doc.fontSize(9).fillColor('#2563eb').text(proj.link, rightX, doc.y, { width: rightWidth });
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica').fillColor('#334155').text(proj.description, rightX, doc.y, { width: rightWidth, align: 'justify', lineHeight: 1.3 });
      doc.moveDown(1);
    });
  }

  if (profile.achievements && profile.achievements.length > 0) {
    renderProfTitle('ACHIEVEMENTS');
    profile.achievements.forEach(ach => {
      doc.fontSize(10).font('Helvetica').fillColor('#334155').text(`• ${ach}`, rightX, doc.y, { width: rightWidth });
      doc.moveDown(0.3);
    });
  }
}

function renderSectionTitle(doc, title, color) {
  doc.fontSize(14).font('Helvetica-Bold').fillColor(color).text(title, { tracking: 1 });
  doc.moveDown(0.5);
  doc.font('Helvetica');
}
