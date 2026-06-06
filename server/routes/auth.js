import express from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User.js';
import { protect, attachUser } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { getJwtSecret } from '../config/jwt.js';

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(userId) {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '7d' });
}

function sendUser(res, user, token) {
  if (token) {
    res.cookie('token', token, cookieOptions);
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

const registerRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2–80 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),

  body('password')
    .notEmpty()
    .withMessage('Password required'),
];

router.post('/register', registerRules, handleValidation, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = signToken(user._id);

    sendUser(res, user, token);
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginRules, handleValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    const token = signToken(user._id);
    user.password = undefined;
    sendUser(res, user, token);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    ...cookieOptions,
    maxAge: 0,
  });

  res.json({
    success: true,
    message: 'Logged out',
  });
});

router.get('/me', protect, attachUser, (req, res) => {
  sendUser(res, req.user);
});

export default router;
