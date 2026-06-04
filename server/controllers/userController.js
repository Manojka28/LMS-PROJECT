import User from '../models/User.js';

export async function getMyCourses(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'purchasedCourses',
      populate: { path: 'instructor', select: 'name email' },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, courses: user.purchasedCourses || [] });
  } catch (err) {
    next(err);
  }
}
