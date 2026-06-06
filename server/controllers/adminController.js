import User from '../models/User.js';
import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import Certificate from '../models/Certificate.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Progress from '../models/Progress.js';
import Wishlist from '../models/Wishlist.js';

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────
export async function getAnalytics(req, res, next) {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalCertificates,
      totalAssignmentSubmissions,
      totalQuizAttempts,
      payments,
      progressDocs,
      totalWishlists,
      topWishlistedCourses
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      Course.countDocuments(),
      Certificate.countDocuments(),
      AssignmentSubmission.countDocuments(),
      QuizAttempt.countDocuments(),
      Payment.find({ paymentStatus: { $in: ['paid', 'enrolledAfterPayment'] } }),
      Progress.find({}),
      Wishlist.countDocuments(),
      Wishlist.aggregate([
        { $group: { _id: '$course', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseData' } },
        { $unwind: '$courseData' },
        { $project: { _id: 1, count: 1, title: '$courseData.title' } }
      ])
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPayments = await Payment.countDocuments();
    const totalEnrollments = progressDocs.length;

    const now = new Date();
    
    // Setup 30 day trends
    const revenueTrends = [];
    const enrollmentTrends = [];
    const userTrends = [];
    const courseTrends = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revenueTrends.push({ date: dateStr, amount: 0 });
      enrollmentTrends.push({ date: dateStr, count: 0 });
      userTrends.push({ date: dateStr, count: 0 });
      courseTrends.push({ date: dateStr, count: 0 });
    }

    payments.forEach(p => {
      const pDate = new Date(p.createdAt).toISOString().split('T')[0];
      const trend = revenueTrends.find(r => r.date === pDate);
      if (trend) trend.amount += p.amount;
    });

    progressDocs.forEach(p => {
      const pDate = new Date(p.createdAt).toISOString().split('T')[0];
      const trend = enrollmentTrends.find(r => r.date === pDate);
      if (trend) trend.count++;
    });

    const users = await User.find().select('createdAt role');
    users.forEach(u => {
      const pDate = new Date(u.createdAt).toISOString().split('T')[0];
      const trend = userTrends.find(r => r.date === pDate);
      if (trend) trend.count++;
    });

    const courses = await Course.find().select('createdAt');
    courses.forEach(c => {
      const pDate = new Date(c.createdAt).toISOString().split('T')[0];
      const trend = courseTrends.find(r => r.date === pDate);
      if (trend) trend.count++;
    });

    const topPurchasedCourses = await Payment.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'enrolledAfterPayment'] } } },
      { $group: { _id: '$course', totalRevenue: { $sum: '$amount' }, enrollments: { $sum: 1 }, title: { $first: '$courseTitle' } } },
      { $sort: { enrollments: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPayments,
        totalCertificates,
        totalAssignmentSubmissions,
        totalQuizAttempts,
        totalWishlists,
        topWishlistedCourses,
        topPurchasedCourses,
        revenueTrends,
        enrollmentTrends,
        userTrends,
        courseTrends
      }
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export async function getUsers(req, res, next) {
  try {
    const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && ['student', 'instructor', 'admin'].includes(role)) {
      query.role = role;
    }
    if (status === 'active') query.isActive = true;
    if (status === 'disabled') query.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/admin/users/:id/status ───────────────────────────────────────
export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own status' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot disable another admin account' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ success: true, message: `User ${isActive ? 'enabled' : 'disabled'} successfully`, user });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete an admin account' });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/courses ───────────────────────────────────────────────────
export async function getCourses(req, res, next) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(query)
    ]);

    // Attach revenue per course from payments
    const courseIds = courses.map(c => c._id);
    const payments = await Payment.aggregate([
      { $match: { course: { $in: courseIds }, paymentStatus: { $in: ['paid', 'enrolledAfterPayment'] } } },
      { $group: { _id: '$course', revenue: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const revenueMap = {};
    payments.forEach(p => { revenueMap[p._id.toString()] = { revenue: p.revenue, paidEnrollments: p.count }; });

    const enriched = courses.map(c => ({
      ...c.toObject(),
      revenue: revenueMap[c._id.toString()]?.revenue || 0,
      paidEnrollments: revenueMap[c._id.toString()]?.paidEnrollments || 0,
      enrollmentCount: c.enrolledStudents?.length || 0
    }));

    res.json({ success: true, courses: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/admin/courses/:id/publish ───────────────────────────────────
export async function updateCourseStatus(req, res, next) {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublished: req.body.isPublished },
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: `Course ${req.body.isPublished ? 'published' : 'unpublished'}`, course });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/admin/courses/:id ───────────────────────────────────────────
export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    // Clean up related records
    await Progress.deleteMany({ course: req.params.id });
    await Wishlist.deleteMany({ course: req.params.id });
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/payments ──────────────────────────────────────────────────
export async function getPayments(req, res, next) {
  try {
    const { status = '', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('student', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query)
    ]);

    res.json({ success: true, payments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/instructors ───────────────────────────────────────────────
export async function getInstructors(req, res, next) {
  try {
    const instructors = await User.find({ role: 'instructor' }).select('-password');

    const enriched = await Promise.all(instructors.map(async (inst) => {
      const courses = await Course.find({ instructor: inst._id });
      const courseIds = courses.map(c => c._id);
      const totalEnrollments = courses.reduce((s, c) => s + (c.enrolledStudents?.length || 0), 0);

      const revenueResult = await Payment.aggregate([
        { $match: { course: { $in: courseIds }, paymentStatus: { $in: ['paid', 'enrolledAfterPayment'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const revenue = revenueResult[0]?.total || 0;

      return {
        _id: inst._id,
        name: inst.name,
        email: inst.email,
        isActive: inst.isActive,
        createdAt: inst.createdAt,
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.isPublished).length,
        totalEnrollments,
        totalRevenue: Math.round(revenue * 100) / 100
      };
    }));

    res.json({ success: true, instructors: enriched });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/export/:type ──────────────────────────────────────────────
export async function exportCSV(req, res, next) {
  try {
    const { type } = req.params;
    let rows = [];
    let headers = [];

    if (type === 'users') {
      headers = ['ID', 'Name', 'Email', 'Role', 'Active', 'Joined'];
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      rows = users.map(u => [
        u._id, u.name, u.email, u.role,
        u.isActive !== false ? 'Yes' : 'No',
        new Date(u.createdAt).toISOString().split('T')[0]
      ]);

    } else if (type === 'payments') {
      headers = ['Payment ID', 'Order ID', 'Student', 'Email', 'Course', 'Amount (INR)', 'Status', 'Method', 'Date'];
      const payments = await Payment.find()
        .populate('student', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 });
      rows = payments.map(p => [
        p.razorpayPaymentId || 'N/A',
        p.razorpayOrderId || 'N/A',
        p.student?.name || 'N/A',
        p.student?.email || 'N/A',
        p.courseTitle || p.course?.title || 'N/A',
        p.amount,
        p.paymentStatus,
        p.paymentMethod || 'razorpay',
        new Date(p.createdAt).toISOString().split('T')[0]
      ]);

    } else if (type === 'courses') {
      headers = ['ID', 'Title', 'Instructor', 'Category', 'Level', 'Price', 'Published', 'Enrollments', 'Created'];
      const courses = await Course.find().populate('instructor', 'name').sort({ createdAt: -1 });
      rows = courses.map(c => [
        c._id, c.title,
        c.instructor?.name || 'N/A',
        c.category || '', c.level || '',
        c.price || 0,
        c.isPublished ? 'Yes' : 'No',
        c.enrolledStudents?.length || 0,
        new Date(c.createdAt).toISOString().split('T')[0]
      ]);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export type. Use: users | payments | courses' });
    }

    const escape = (val) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
